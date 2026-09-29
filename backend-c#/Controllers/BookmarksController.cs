using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/bookmarks")]
[Authorize]
public class BookmarksController(DbConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at, p.user_id AS authorId,
                     u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url,
                     (u.role = 'admin') AS authorIsAdmin,
                     (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
                     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments,
                     EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = @me) AS liked,
                     TRUE AS bookmarked,
                     (p.deleted_at IS NOT NULL) AS isDeleted
              FROM bookmarks b
              JOIN posts p ON p.id = b.post_id
              JOIN users u ON u.id = p.user_id
              WHERE b.user_id = @me
              ORDER BY b.created_at DESC",
            new { me });

        return Ok(new { posts = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpPost("{postId:int}")]
    public async Task<IActionResult> Add(int postId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var postExists = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM posts WHERE id = @postId AND deleted_at IS NULL", new { postId });
        if (postExists is null)
            return NotFound(new MessageResponse("Bài viết không tồn tại."));

        await connection.ExecuteAsync(
            "INSERT IGNORE INTO bookmarks (user_id, post_id) VALUES (@me, @postId)", new { me, postId });

        return StatusCode(201, new { bookmarked = true });
    }

    [HttpDelete("{postId:int}")]
    public async Task<IActionResult> Remove(int postId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            "DELETE FROM bookmarks WHERE user_id = @me AND post_id = @postId", new { me, postId });

        return NoContent();
    }
}
