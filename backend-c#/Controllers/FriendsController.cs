using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;
using NovaApi.Services;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/friends")]
[Authorize]
public class FriendsController(DbConnectionFactory db, NotifyService notify) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListFriends()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
              FROM friendships f
              JOIN users u ON u.id = IF(f.requester_id = @me, f.addressee_id, f.requester_id)
              WHERE (f.requester_id = @me OR f.addressee_id = @me) AND f.status = 'accepted'
              ORDER BY u.name",
            new { me });

        return Ok(new { friends = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpGet("requests")]
    public async Task<IActionResult> ListRequests()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
              FROM friendships f
              JOIN users u ON u.id = f.requester_id
              WHERE f.addressee_id = @me AND f.status = 'pending'
              ORDER BY f.created_at DESC",
            new { me });

        return Ok(new { requests = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> Suggestions()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
              FROM users u
              WHERE u.id != @me
                AND u.id NOT IN (
                  SELECT IF(requester_id = @me, addressee_id, requester_id)
                  FROM friendships
                  WHERE requester_id = @me OR addressee_id = @me
                )
              ORDER BY RAND()
              LIMIT 10",
            new { me });

        return Ok(new { suggestions = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpPost("{userId:int}/request")]
    public async Task<IActionResult> SendRequest(int userId)
    {
        var me = this.CurrentUserId();
        if (userId == me)
            return BadRequest(new MessageResponse("Không thể tự kết bạn với chính mình."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var existing = await connection.QuerySingleOrDefaultAsync<int?>(
            @"SELECT id FROM friendships
              WHERE (requester_id = @me AND addressee_id = @userId) OR (requester_id = @userId AND addressee_id = @me)",
            new { me, userId });

        if (existing is not null)
            return Conflict(new MessageResponse("Đã tồn tại quan hệ bạn bè hoặc lời mời."));

        await connection.ExecuteAsync(
            "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (@me, @userId, 'pending')",
            new { me, userId });

        await notify.CreateAsync(userId, me, "friend_request");

        return StatusCode(201, new MessageResponse("Đã gửi lời mời kết bạn."));
    }

    [HttpPost("{userId:int}/accept")]
    public async Task<IActionResult> Accept(int userId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var affected = await connection.ExecuteAsync(
            "UPDATE friendships SET status = 'accepted' WHERE requester_id = @userId AND addressee_id = @me AND status = 'pending'",
            new { userId, me });

        if (affected == 0)
            return NotFound(new MessageResponse("Không tìm thấy lời mời kết bạn."));

        await notify.CreateAsync(userId, me, "friend_accept");

        return Ok(new MessageResponse("Đã chấp nhận lời mời kết bạn."));
    }

    [HttpPost("{userId:int}/decline")]
    public async Task<IActionResult> Decline(int userId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            "DELETE FROM friendships WHERE requester_id = @userId AND addressee_id = @me AND status = 'pending'",
            new { userId, me });

        return NoContent();
    }

    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> Unfriend(int userId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            @"DELETE FROM friendships
              WHERE status = 'accepted' AND ((requester_id = @me AND addressee_id = @userId) OR (requester_id = @userId AND addressee_id = @me))",
            new { me, userId });

        return NoContent();
    }

    [HttpPost("{userId:int}/block")]
    public async Task<IActionResult> Block(int userId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var statuses = await connection.QueryAsync<string>(
            @"SELECT status FROM friendships
              WHERE (requester_id = @me AND addressee_id = @userId) OR (requester_id = @userId AND addressee_id = @me)",
            new { me, userId });
        var wasFriends = statuses.Any(s => s == "accepted");

        await connection.ExecuteAsync(
            @"DELETE FROM friendships
              WHERE (requester_id = @me AND addressee_id = @userId) OR (requester_id = @userId AND addressee_id = @me)",
            new { me, userId });

        await connection.ExecuteAsync(
            "INSERT INTO friendships (requester_id, addressee_id, status, was_friends) VALUES (@me, @userId, 'blocked', @wasFriends)",
            new { me, userId, wasFriends });

        return NoContent();
    }

    [HttpGet("blocked")]
    public async Task<IActionResult> ListBlocked()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
              FROM friendships f
              JOIN users u ON u.id = f.addressee_id
              WHERE f.requester_id = @me AND f.status = 'blocked'
              ORDER BY u.name",
            new { me });

        return Ok(new { blocked = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpPost("{userId:int}/unblock")]
    public async Task<IActionResult> Unblock(int userId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var wasFriends = await connection.QuerySingleOrDefaultAsync<bool?>(
            "SELECT was_friends FROM friendships WHERE requester_id = @me AND addressee_id = @userId AND status = 'blocked'",
            new { me, userId });

        if (wasFriends is null)
            return NotFound(new MessageResponse("Bạn chưa chặn người dùng này."));

        if (wasFriends.Value)
        {
            await connection.ExecuteAsync(
                "UPDATE friendships SET status = 'accepted', was_friends = FALSE WHERE requester_id = @me AND addressee_id = @userId",
                new { me, userId });
            return Ok(new { restored = true });
        }

        await connection.ExecuteAsync(
            "DELETE FROM friendships WHERE requester_id = @me AND addressee_id = @userId AND status = 'blocked'",
            new { me, userId });

        return Ok(new { restored = false });
    }
}
