namespace NovaApi.DTOs;

public record CreatePostForm(string? Content, IFormFile? Image, string? CommentPermission, string? AllowSharing);

public record CreateCommentRequest(string? Content);

public record IdResponse(int Id);
