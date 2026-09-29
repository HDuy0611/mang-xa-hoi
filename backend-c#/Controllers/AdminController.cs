using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;
using NovaApi.Filters;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
[RequireAdmin]
public class AdminController(DbConnectionFactory db) : ControllerBase
{
    private static (int Page, int Limit, int Offset) ParsePaging(int? page, int? limit)
    {
        var p = Math.Max(1, page ?? 1);
        var l = Math.Min(50, Math.Max(1, limit ?? 20));
        return (p, l, (p - 1) * l);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var userCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM users");
        var postCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL");
        var commentCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM comments");
        var lockedCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM users WHERE is_locked = TRUE");
        var pendingReportCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM reports WHERE status = 'pending'");

        return Ok(new { userCount, postCount, commentCount, lockedCount, pendingReportCount });
    }

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers([FromQuery] string? search, [FromQuery] bool? locked, [FromQuery] int? page, [FromQuery] int? limit)
    {
        var (p, l, offset) = ParsePaging(page, limit);
        search = search?.Trim();

        var conditions = new List<string>();
        if (!string.IsNullOrEmpty(search))
            conditions.Add("(name LIKE @search OR username LIKE @search OR email LIKE @search)");
        if (locked == true)
            conditions.Add("is_locked = TRUE");
        var where = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var queryParams = new { search = $"%{search}%", limit = l, offset };

        var total = await connection.QuerySingleAsync<int>($"SELECT COUNT(*) FROM users {where}", queryParams);
        var rows = await connection.QueryAsync(
            $@"SELECT id, name, username, email, role, avatar_url AS avatarUrl,
                      is_locked AS isLocked, locked_until AS lockedUntil, created_at AS createdAt
               FROM users {where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset",
            queryParams);

        return Ok(new
        {
            users = rows.Select(r => (IDictionary<string, object>)r),
            total,
            page = p,
            totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)l)),
        });
    }

    [HttpPatch("users/{id:int}/lock")]
    public async Task<IActionResult> LockUser(int id, [FromBody] LockUserRequest request)
    {
        var me = this.CurrentUserId();
        if (id == me)
            return BadRequest(new MessageResponse("Không thể tự khóa tài khoản của chính mình."));

        var reason = request.Reason?.Trim();
        if (string.IsNullOrEmpty(reason))
            return BadRequest(new MessageResponse("Vui lòng nhập lý do khóa."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var target = await connection.QuerySingleOrDefaultAsync<(string Username, string Role)?>(
            "SELECT username, role FROM users WHERE id = @id", new { id });
        if (target is null)
            return NotFound(new MessageResponse("Không tìm thấy người dùng."));
        if (target.Value.Role == "admin")
            return BadRequest(new MessageResponse("Không thể khóa tài khoản quản trị viên khác."));

        var days = request.Days is > 0 ? Math.Max(1, request.Days.Value) : (int?)null;
        var truncatedReason = reason.Length > 500 ? reason[..500] : reason;

        if (days is not null)
        {
            await connection.ExecuteAsync(
                "UPDATE users SET is_locked = TRUE, locked_until = DATE_ADD(NOW(), INTERVAL @days DAY), locked_reason = @truncatedReason WHERE id = @id",
                new { days, truncatedReason, id });
        }
        else
        {
            await connection.ExecuteAsync(
                "UPDATE users SET is_locked = TRUE, locked_until = NULL, locked_reason = @truncatedReason WHERE id = @id",
                new { truncatedReason, id });
        }

        return Ok(new MessageResponse(days is not null ? $"Đã khóa trong {days} ngày." : "Đã khóa vĩnh viễn."));
    }

    [HttpPatch("users/{id:int}/unlock")]
    public async Task<IActionResult> UnlockUser(int id)
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var exists = await connection.QuerySingleOrDefaultAsync<int?>("SELECT id FROM users WHERE id = @id", new { id });
        if (exists is null)
            return NotFound(new MessageResponse("Không tìm thấy người dùng."));

        await connection.ExecuteAsync(
            "UPDATE users SET is_locked = FALSE, locked_until = NULL, locked_reason = NULL WHERE id = @id", new { id });

        return Ok(new MessageResponse("Đã mở khóa tài khoản."));
    }

    [HttpGet("posts")]
    public async Task<IActionResult> ListPosts([FromQuery] string? search, [FromQuery] int? page, [FromQuery] int? limit)
    {
        var (p, l, offset) = ParsePaging(page, limit);
        search = search?.Trim();

        var where = "WHERE p.deleted_at IS NULL" + (string.IsNullOrEmpty(search) ? "" : " AND (p.content LIKE @search OR u.name LIKE @search OR u.username LIKE @search)");
        var queryParams = new { search = $"%{search}%", limit = l, offset };

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var total = await connection.QuerySingleAsync<int>(
            $"SELECT COUNT(*) FROM posts p JOIN users u ON u.id = p.user_id {where}", queryParams);

        var rows = await connection.QueryAsync(
            $@"SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at AS createdAt,
                      u.name AS authorName, u.username AS authorUsername,
                      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
                      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments
               FROM posts p JOIN users u ON u.id = p.user_id
               {where}
               ORDER BY p.created_at DESC LIMIT @limit OFFSET @offset",
            queryParams);

        return Ok(new
        {
            posts = rows.Select(r => (IDictionary<string, object>)r),
            total,
            page = p,
            totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)l)),
        });
    }

    [HttpDelete("posts/{id:int}")]
    public async Task<IActionResult> DeletePost(int id)
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var exists = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM posts WHERE id = @id AND deleted_at IS NULL", new { id });
        if (exists is null)
            return NotFound(new MessageResponse("Bài viết không tồn tại."));

        // Xoá mềm giống người dùng tự xoá: báo cáo và mục Đã lưu vẫn còn trỏ được tới bài viết
        await connection.ExecuteAsync("UPDATE posts SET deleted_at = NOW() WHERE id = @id", new { id });
        return NoContent();
    }

    private static async Task<(int Id, string Username, string Role)?> ResolveReportTargetUserAsync(
        DbConnectionFactory db, string targetType, int targetId)
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        if (targetType == "user")
        {
            return await connection.QuerySingleOrDefaultAsync<(int, string, string)?>(
                "SELECT id, username, role FROM users WHERE id = @targetId", new { targetId });
        }

        return await connection.QuerySingleOrDefaultAsync<(int, string, string)?>(
            "SELECT u.id, u.username, u.role FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = @targetId",
            new { targetId });
    }

    [HttpGet("reports")]
    public async Task<IActionResult> ListReports([FromQuery] string? status, [FromQuery] int? page, [FromQuery] int? limit)
    {
        var (p, l, offset) = ParsePaging(page, limit);
        status = status?.Trim();

        var where = string.IsNullOrEmpty(status) ? "" : "WHERE r.status = @status";
        var queryParams = new { status, limit = l, offset };

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var total = await connection.QuerySingleAsync<int>($"SELECT COUNT(*) FROM reports r {where}", queryParams);

        var rows = await connection.QueryAsync(
            $@"SELECT r.id, r.target_type AS targetType, r.target_id AS targetId, r.reason, r.status,
                      r.created_at AS createdAt,
                      ru.name AS reporterName, ru.username AS reporterUsername,
                      tu.name AS targetUserName, tu.username AS targetUsername,
                      tp.content AS targetPostContent, pu.username AS targetPostAuthorUsername
               FROM reports r
               JOIN users ru ON ru.id = r.reporter_id
               LEFT JOIN users tu ON r.target_type = 'user' AND tu.id = r.target_id
               LEFT JOIN posts tp ON r.target_type = 'post' AND tp.id = r.target_id
               LEFT JOIN users pu ON pu.id = tp.user_id
               {where}
               ORDER BY (r.status = 'pending') DESC, r.created_at DESC
               LIMIT @limit OFFSET @offset",
            queryParams);

        return Ok(new
        {
            reports = rows.Select(r => (IDictionary<string, object>)r),
            total,
            page = p,
            totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)l)),
        });
    }

    private record ReportRow(int Id, string TargetType, int TargetId, string Status);

    [HttpPatch("reports/{id:int}/dismiss")]
    public async Task<IActionResult> DismissReport(int id)
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var report = await connection.QuerySingleOrDefaultAsync<ReportRow>(
            "SELECT id AS Id, target_type AS TargetType, target_id AS TargetId, status AS Status FROM reports WHERE id = @id", new { id });
        if (report is null)
            return NotFound(new MessageResponse("Không tìm thấy báo cáo."));
        if (report.Status != "pending")
            return BadRequest(new MessageResponse("Báo cáo này đã được xử lý."));

        var me = this.CurrentUserId();
        await connection.ExecuteAsync(
            "UPDATE reports SET status = 'dismissed', resolved_by = @me, resolved_at = NOW() WHERE id = @id",
            new { me, id = report.Id });

        return Ok(new MessageResponse("Đã bỏ qua báo cáo."));
    }

    [HttpPatch("reports/{id:int}/warn")]
    public async Task<IActionResult> WarnReport(int id, [FromBody] WarnReportRequest request)
    {
        var reason = request.Reason?.Trim();
        if (string.IsNullOrEmpty(reason))
            return BadRequest(new MessageResponse("Vui lòng nhập lý do cảnh cáo."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var report = await connection.QuerySingleOrDefaultAsync<ReportRow>(
            "SELECT id AS Id, target_type AS TargetType, target_id AS TargetId, status AS Status FROM reports WHERE id = @id", new { id });
        if (report is null)
            return NotFound(new MessageResponse("Không tìm thấy báo cáo."));
        if (report.Status != "pending")
            return BadRequest(new MessageResponse("Báo cáo này đã được xử lý."));

        var target = await ResolveReportTargetUserAsync(db, report.TargetType, report.TargetId);
        if (target is null)
            return NotFound(new MessageResponse("Không tìm thấy đối tượng bị báo cáo."));
        if (target.Value.Role == "admin")
            return BadRequest(new MessageResponse("Không thể cảnh cáo quản trị viên khác."));

        var me = this.CurrentUserId();
        var truncatedReason = reason.Length > 500 ? reason[..500] : reason;

        await connection.ExecuteAsync(
            "INSERT INTO notifications (user_id, actor_id, type, message) VALUES (@targetId, @me, 'warning', @truncatedReason)",
            new { targetId = target.Value.Id, me, truncatedReason });

        await connection.ExecuteAsync(
            "UPDATE reports SET status = 'resolved', resolved_by = @me, resolved_at = NOW() WHERE id = @id",
            new { me, id = report.Id });

        return Ok(new MessageResponse($"Đã cảnh cáo @{target.Value.Username}."));
    }

    [HttpPatch("reports/{id:int}/lock")]
    public async Task<IActionResult> LockReport(int id, [FromBody] LockUserRequest request)
    {
        var reason = request.Reason?.Trim();
        if (string.IsNullOrEmpty(reason))
            return BadRequest(new MessageResponse("Vui lòng nhập lý do khóa."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var report = await connection.QuerySingleOrDefaultAsync<ReportRow>(
            "SELECT id AS Id, target_type AS TargetType, target_id AS TargetId, status AS Status FROM reports WHERE id = @id", new { id });
        if (report is null)
            return NotFound(new MessageResponse("Không tìm thấy báo cáo."));
        if (report.Status != "pending")
            return BadRequest(new MessageResponse("Báo cáo này đã được xử lý."));

        var target = await ResolveReportTargetUserAsync(db, report.TargetType, report.TargetId);
        if (target is null)
            return NotFound(new MessageResponse("Không tìm thấy đối tượng bị báo cáo."));
        if (target.Value.Role == "admin")
            return BadRequest(new MessageResponse("Không thể khóa tài khoản quản trị viên khác."));

        var me = this.CurrentUserId();
        if (target.Value.Id == me)
            return BadRequest(new MessageResponse("Không thể tự khóa tài khoản của chính mình."));

        var days = request.Days is > 0 ? Math.Max(1, request.Days.Value) : (int?)null;
        var truncatedReason = reason.Length > 500 ? reason[..500] : reason;

        if (days is not null)
        {
            await connection.ExecuteAsync(
                "UPDATE users SET is_locked = TRUE, locked_until = DATE_ADD(NOW(), INTERVAL @days DAY), locked_reason = @truncatedReason WHERE id = @id",
                new { days, truncatedReason, id = target.Value.Id });
        }
        else
        {
            await connection.ExecuteAsync(
                "UPDATE users SET is_locked = TRUE, locked_until = NULL, locked_reason = @truncatedReason WHERE id = @id",
                new { truncatedReason, id = target.Value.Id });
        }

        await connection.ExecuteAsync(
            "UPDATE reports SET status = 'resolved', resolved_by = @me, resolved_at = NOW() WHERE id = @id",
            new { me, id = report.Id });

        return Ok(new MessageResponse(days is not null
            ? $"Đã khóa @{target.Value.Username} trong {days} ngày."
            : $"Đã khóa vĩnh viễn @{target.Value.Username}."));
    }
}
