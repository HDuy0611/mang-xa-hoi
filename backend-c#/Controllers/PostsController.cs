using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;
using NovaApi.Services;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/posts")]
[Authorize]
public class PostsController(DbConnectionFactory db, UploadService uploadService, NotifyService notify) : ControllerBase
{
    private static readonly string[] CommentPermissions = ["everyone", "friends", "nobody"];

    [HttpGet]
    public async Task<IActionResult> GetFeed([FromQuery] int? userId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var where = "WHERE p.deleted_at IS NULL" + (userId.HasValue ? " AND p.user_id = @userId" : "");
        var rows = await connection.QueryAsync(
            $@"SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at, p.user_id AS authorId,
                      p.comment_permission AS commentPermission, p.allow_sharing AS allowSharing,
                      u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url,
                      (u.role = 'admin') AS authorIsAdmin,
                      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
                      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments,
                      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = @me) AS liked,
                      EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = @me) AS bookmarked
               FROM posts p
               JOIN users u ON u.id = p.user_id
               {where}
               ORDER BY p.created_at DESC
               LIMIT 50",
            new { me, userId });

        return Ok(new { posts = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromForm] string? content, IFormFile? image,
        [FromForm] string? commentPermission, [FromForm] string? allowSharing)
    {
        var me = this.CurrentUserId();
        var trimmed = content?.Trim();

        if (string.IsNullOrEmpty(trimmed))
            return BadRequest(new MessageResponse("Nội dung bài viết không được để trống."));

        string? imageUrl = null;
        if (image is not null)
        {
            var uploaded = await uploadService.SaveImageAsync(image);
            if (!uploaded.Success)
                return BadRequest(new MessageResponse(uploaded.Error!));
            imageUrl = uploaded.Url;
        }

        var permission = CommentPermissions.Contains(commentPermission) ? commentPermission : "everyone";
        var allowSharingValue = allowSharing != "false";

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var id = await connection.QuerySingleAsync<int>(
            @"INSERT INTO posts (user_id, content, image_url, comment_permission, allow_sharing)
              VALUES (@me, @trimmed, @imageUrl, @permission, @allowSharingValue);
              SELECT LAST_INSERT_ID();",
            new { me, trimmed, imageUrl, permission, allowSharingValue });

        return StatusCode(201, new IdResponse(id));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var row = await connection.QuerySingleOrDefaultAsync(
            @"SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at, p.user_id AS authorId,
                     p.comment_permission AS commentPermission, p.allow_sharing AS allowSharing,
                     u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url,
                     (u.role = 'admin') AS authorIsAdmin,
                     (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
                     (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments,
                     EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = @me) AS liked,
                     EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = @me) AS bookmarked
              FROM posts p
              JOIN users u ON u.id = p.user_id
              WHERE p.id = @id AND p.deleted_at IS NULL",
            new { me, id });

        if (row is null)
            return NotFound(new MessageResponse("Bài viết không tồn tại."));

        return Ok(new { post = (IDictionary<string, object>)row });
    }

    [HttpPost("{id:int}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var postExists = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM posts WHERE id = @id AND deleted_at IS NULL", new { id });
        if (postExists is null)
            return NotFound(new MessageResponse("Bài viết không tồn tại."));

        var alreadyLiked = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT 1 FROM post_likes WHERE post_id = @id AND user_id = @me", new { id, me }) is not null;

        if (alreadyLiked)
        {
            await connection.ExecuteAsync("DELETE FROM post_likes WHERE post_id = @id AND user_id = @me", new { id, me });
        }
        else
        {
            await connection.ExecuteAsync("INSERT INTO post_likes (post_id, user_id) VALUES (@id, @me)", new { id, me });

            var authorId = await connection.QuerySingleOrDefaultAsync<int?>(
                "SELECT user_id FROM posts WHERE id = @id", new { id });
            if (authorId.HasValue)
                await notify.CreateAsync(authorId.Value, me, "like", postId: id);
        }

        var likes = await connection.QuerySingleAsync<int>(
            "SELECT COUNT(*) FROM post_likes WHERE post_id = @id", new { id });

        return Ok(new { liked = !alreadyLiked, likes });
    }

    [HttpGet("{id:int}/likes")]
    public async Task<IActionResult> GetLikes(int id)
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
              FROM post_likes pl
              JOIN users u ON u.id = pl.user_id
              WHERE pl.post_id = @id
              ORDER BY pl.created_at DESC",
            new { id });

        return Ok(new { users = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpGet("{id:int}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var rows = await connection.QueryAsync(
            @"SELECT c.id, c.content, c.created_at, c.user_id AS authorId,
                     u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url
              FROM comments c
              JOIN users u ON u.id = c.user_id
              WHERE c.post_id = @id
              ORDER BY c.created_at ASC",
            new { id });

        return Ok(new { comments = rows.Select(r => (IDictionary<string, object>)r) });
    }

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentRequest request)
    {
        var me = this.CurrentUserId();
        var content = request.Content?.Trim();

        if (string.IsNullOrEmpty(content))
            return BadRequest(new MessageResponse("Bình luận không được để trống."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var post = await connection.QuerySingleOrDefaultAsync<(int UserId, string CommentPermission, DateTime? DeletedAt)?>(
            "SELECT user_id AS UserId, comment_permission AS CommentPermission, deleted_at AS DeletedAt FROM posts WHERE id = @id", new { id });

        if (post is null || post.Value.DeletedAt is not null)
            return NotFound(new MessageResponse("Bài viết không tồn tại."));

        if (post.Value.UserId != me)
        {
            if (post.Value.CommentPermission == "nobody")
                return StatusCode(403, new MessageResponse("Bài viết này đã tắt bình luận."));

            if (post.Value.CommentPermission == "friends")
            {
                var isFriend = await connection.QuerySingleOrDefaultAsync<int?>(
                    @"SELECT 1 FROM friendships WHERE status = 'accepted'
                      AND ((requester_id = @me AND addressee_id = @authorId) OR (requester_id = @authorId AND addressee_id = @me))",
                    new { me, authorId = post.Value.UserId }) is not null;

                if (!isFriend)
                    return StatusCode(403, new MessageResponse("Chỉ bạn bè của tác giả mới có thể bình luận bài viết này."));
            }
        }

        var commentId = await connection.QuerySingleAsync<int>(
            "INSERT INTO comments (post_id, user_id, content) VALUES (@id, @me, @content); SELECT LAST_INSERT_ID();",
            new { id, me, content });

        await notify.CreateAsync(post.Value.UserId, me, "comment", postId: id, commentId: commentId);

        return StatusCode(201, new IdResponse(commentId));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var authorId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT user_id FROM posts WHERE id = @id", new { id });

        if (authorId is null)
            return NotFound(new MessageResponse("Bài viết không tồn tại."));
        if (authorId != me)
            return StatusCode(403, new MessageResponse("Bạn không có quyền xoá bài viết này."));

        await connection.ExecuteAsync("UPDATE posts SET deleted_at = NOW() WHERE id = @id", new { id });
        return NoContent();
    }

    [HttpDelete("{postId:int}/comments/{commentId:int}")]
    public async Task<IActionResult> DeleteComment(int postId, int commentId)
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var authorId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT user_id FROM comments WHERE id = @commentId", new { commentId });

        if (authorId is null)
            return NotFound(new MessageResponse("Bình luận không tồn tại."));
        if (authorId != me)
            return StatusCode(403, new MessageResponse("Bạn không có quyền xoá bình luận này."));

        await connection.ExecuteAsync("DELETE FROM comments WHERE id = @commentId", new { commentId });
        return NoContent();
    }
}
