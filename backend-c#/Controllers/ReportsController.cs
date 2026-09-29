using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController(DbConnectionFactory db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportRequest request)
    {
        var targetType = request.TargetType;
        if (targetType != "user" && targetType != "post")
            return BadRequest(new MessageResponse("Loại đối tượng báo cáo không hợp lệ."));

        var id = request.TargetId ?? 0;
        if (id <= 0)
            return BadRequest(new MessageResponse("Thiếu đối tượng cần báo cáo."));

        var reason = request.Reason?.Trim();
        if (string.IsNullOrEmpty(reason))
            return BadRequest(new MessageResponse("Vui lòng nhập lý do báo cáo."));

        var me = this.CurrentUserId();

        if (targetType == "user" && id == me)
            return BadRequest(new MessageResponse("Không thể tự báo cáo chính mình."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        if (targetType == "user")
        {
            var target = await connection.QuerySingleOrDefaultAsync<(int Id, string? Role)?>(
                "SELECT id, role AS Role FROM users WHERE id = @id", new { id });
            if (target is null)
                return NotFound(new MessageResponse("Không tìm thấy người dùng."));
            if (target.Value.Role == "admin")
                return BadRequest(new MessageResponse("Không thể báo cáo tài khoản quản trị viên."));
        }
        else
        {
            var post = await connection.QuerySingleOrDefaultAsync<(int Id, int UserId, string? Role)?>(
                "SELECT p.id AS Id, p.user_id AS UserId, u.role AS Role FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = @id", new { id });
            if (post is null)
                return NotFound(new MessageResponse("Không tìm thấy bài viết."));
            if (post.Value.UserId == me)
                return BadRequest(new MessageResponse("Không thể tự báo cáo bài viết của chính mình."));
            if (post.Value.Role == "admin")
                return BadRequest(new MessageResponse("Không thể báo cáo bài viết của quản trị viên."));
        }

        await connection.ExecuteAsync(
            "INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (@me, @targetType, @id, @reason)",
            new { me, targetType, id, reason = reason.Length > 500 ? reason[..500] : reason });

        return StatusCode(201, new MessageResponse("Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng an toàn hơn."));
    }
}
