using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.Extensions;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController(DbConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q)
    {
        var me = this.CurrentUserId();
        var query = q?.Trim() ?? "";

        if (string.IsNullOrEmpty(query))
            return Ok(new { users = Array.Empty<object>(), posts = Array.Empty<object>() });

        var like = $"%{query}%";

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var users = await connection.QueryAsync(
            @"SELECT id, name, username, avatar_url AS avatarUrl
              FROM users
              WHERE (name LIKE @like OR username LIKE @like) AND id != @me
              LIMIT 8",
            new { like, me });

        var posts = await connection.QueryAsync(
            @"SELECT p.id, p.content, p.created_at,
                     u.id AS author_id, u.name AS author_name, u.username AS author_username
              FROM posts p
              JOIN users u ON u.id = p.user_id
              WHERE p.deleted_at IS NULL AND p.content LIKE @like
              ORDER BY p.created_at DESC
              LIMIT 8",
            new { like });

        return Ok(new
        {
            users = users.Select(r => (IDictionary<string, object>)r),
            posts = posts.Select(r => (IDictionary<string, object>)r),
        });
    }
}
