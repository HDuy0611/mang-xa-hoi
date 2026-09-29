namespace NovaApi.DTOs;

public record UpdateProfileRequest(string? Name, string? Bio, string? Location, string? Website);

public record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);
