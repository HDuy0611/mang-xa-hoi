using Dapper;
using Microsoft.AspNetCore.SignalR;
using NovaApi.Data;
using NovaApi.Hubs;

namespace NovaApi.Services;

public class NotifyService(DbConnectionFactory db, IHubContext<NotificationsHub> hub)
{
    public async Task CreateAsync(int userId, int actorId, string type, int? postId = null, int? commentId = null)
    {
        if (userId == actorId) return;

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var id = await connection.QuerySingleAsync<int>(
            @"INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES (@userId, @actorId, @type, @postId, @commentId);
              SELECT LAST_INSERT_ID();",
            new { userId, actorId, type, postId, commentId });

        var row = await connection.QuerySingleAsync(
            @"SELECT n.id, n.type, n.is_read AS isRead, n.created_at AS createdAt,
                     n.post_id AS postId, n.comment_id AS commentId, n.message,
                     a.id AS actorId, a.name AS actorName, a.username AS actorUsername, a.avatar_url AS actorAvatarUrl
              FROM notifications n JOIN users a ON a.id = n.actor_id WHERE n.id = @id",
            new { id });

        await hub.Clients.User(userId.ToString()).SendAsync("notification:new", (object)row);
    }
}
