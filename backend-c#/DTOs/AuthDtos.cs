namespace NovaApi.DTOs;

public record RegisterRequest(string? Name, string? Email, string? Password);

public record LoginRequest(string? Email, string? Password);

public record GoogleLoginRequest(string? AccessToken);

public record FacebookLoginRequest(string? AccessToken);

public record ForgotPasswordRequest(string? Email);

public record ResetPasswordRequest(string? Token, string? NewPassword);

public record UserResponse(int Id, string Name, string Username, string Email, string Role);

public record MessageResponse(string Message);
