using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;
using NovaApi.Services;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(DbConnectionFactory db, UploadService uploadService) : ControllerBase
{
    private const string SelectProfile =
        @"SELECT id, name, username, email, bio, location, website,
                 avatar_url AS avatarUrl, cover_url AS coverUrl, created_at AS createdAt
          FROM users WHERE id = @id";

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var user = await connection.QuerySingleOrDefaultAsync(SelectProfile, new { id = me });
        if (user is null)
            return NotFound(new MessageResponse("Không tìm thấy người dùng."));

        return Ok(new { user = (IDictionary<string, object>)user });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var me = this.CurrentUserId();
        var name = request.Name?.Trim();

        if (string.IsNullOrEmpty(name))
            return BadRequest(new MessageResponse("Họ và tên không được để trống."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            "UPDATE users SET name = @name, bio = @bio, location = @location, website = @website WHERE id = @me",
            new
            {
                name,
                bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim(),
                location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim(),
                website = string.IsNullOrWhiteSpace(request.Website) ? null : request.Website.Trim(),
                me,
            });

        var user = await connection.QuerySingleAsync(SelectProfile, new { id = me });
        return Ok(new { user = (IDictionary<string, object>)user });
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var me = this.CurrentUserId();

        if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest(new MessageResponse("Vui lòng nhập đầy đủ mật khẩu."));
        if (request.NewPassword.Length < 6)
            return BadRequest(new MessageResponse("Mật khẩu mới phải có ít nhất 6 ký tự."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var currentHash = await connection.QuerySingleOrDefaultAsync<string?>(
            "SELECT password_hash FROM users WHERE id = @me", new { me });

        if (currentHash is null || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, currentHash))
            return Unauthorized(new MessageResponse("Mật khẩu hiện tại không đúng."));

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await connection.ExecuteAsync("UPDATE users SET password_hash = @newHash WHERE id = @me", new { newHash, me });

        return Ok(new MessageResponse("Đổi mật khẩu thành công."));
    }

    [HttpPost("me/avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile? avatar)
    {
        var me = this.CurrentUserId();
        var uploaded = await uploadService.SaveImageAsync(avatar);
        if (!uploaded.Success)
            return BadRequest(new MessageResponse(uploaded.Error!));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync("UPDATE users SET avatar_url = @url WHERE id = @me", new { url = uploaded.Url, me });

        return Ok(new { avatarUrl = uploaded.Url });
    }

    [HttpPost("me/cover")]
    public async Task<IActionResult> UploadCover(IFormFile? cover)
    {
        var me = this.CurrentUserId();
        var uploaded = await uploadService.SaveImageAsync(cover);
        if (!uploaded.Success)
            return BadRequest(new MessageResponse(uploaded.Error!));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync("UPDATE users SET cover_url = @url WHERE id = @me", new { url = uploaded.Url, me });

        return Ok(new { coverUrl = uploaded.Url });
    }

    [HttpPost("me/deactivate")]
    public async Task<IActionResult> Deactivate()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            @"INSERT INTO user_settings (user_id, is_deactivated) VALUES (@me, TRUE)
              ON DUPLICATE KEY UPDATE is_deactivated = TRUE",
            new { me });

        return Ok(new MessageResponse("Đã vô hiệu hóa tài khoản. Đăng nhập lại để khôi phục."));
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync("DELETE FROM users WHERE id = @me", new { me });
        return NoContent();
    }

    [HttpGet("{username}")]
    public async Task<IActionResult> GetByUsername(string username)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var user = await connection.QuerySingleOrDefaultAsync(
            @"SELECT id, name, username, bio, location, website, role,
                     avatar_url AS avatarUrl, cover_url AS coverUrl, created_at AS createdAt
              FROM users WHERE username = @username",
            new { username });

        if (user is null)
            return NotFound(new MessageResponse("Không tìm thấy người dùng."));

        var userDict = (IDictionary<string, object>)user;
        var userId = (int)userDict["id"];

        var postCount = await connection.QuerySingleAsync<int>(
            "SELECT COUNT(*) FROM posts WHERE user_id = @userId AND deleted_at IS NULL", new { userId });
        var friendCount = await connection.QuerySingleAsync<int>(
            "SELECT COUNT(*) FROM friendships WHERE (requester_id = @userId OR addressee_id = @userId) AND status = 'accepted'",
            new { userId });

        var relationship = "self";
        var blockedByMe = false;

        if (userId != me)
        {
            var rel = await connection.QuerySingleOrDefaultAsync<(int RequesterId, string Status)?>(
                @"SELECT requester_id AS RequesterId, status AS Status FROM friendships
                  WHERE (requester_id = @me AND addressee_id = @userId) OR (requester_id = @userId AND addressee_id = @me)",
                new { me, userId });

            if (rel is null) relationship = "none";
            else if (rel.Value.Status == "blocked")
            {
                relationship = "blocked";
                blockedByMe = rel.Value.RequesterId == me;
            }
            else if (rel.Value.Status == "accepted") relationship = "friends";
            else relationship = rel.Value.RequesterId == me ? "request_sent" : "request_received";
        }

        return Ok(new { user = userDict, postCount, friendCount, relationship, blockedByMe });
    }
}
