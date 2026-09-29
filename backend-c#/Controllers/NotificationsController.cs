using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.Extensions;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(DbConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT n.id, n.type, n.is_read AS isRead, n.created_at AS createdAt,
                     n.post_id AS postId, n.comment_id AS commentId,
                     a.id AS actorId, a.name AS actorName, a.username AS actorUsername, a.avatar_url AS actorAvatarUrl
              FROM notifications n
              JOIN users a ON a.id = n.actor_id
              WHERE n.user_id = @me
              ORDER BY n.created_at DESC
              LIMIT 50",
            new { me });

        return Ok(new { notifications = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var count = await connection.QuerySingleAsync<int>(
            "SELECT COUNT(*) FROM notifications WHERE user_id = @me AND is_read = FALSE", new { me });

        return Ok(new { count });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync("UPDATE notifications SET is_read = TRUE WHERE user_id = @me", new { me });
        return NoContent();
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> ReadOne(int id)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            "UPDATE notifications SET is_read = TRUE WHERE id = @id AND user_id = @me", new { id, me });
        return NoContent();
    }
}
