namespace NovaApi.DTOs;

public record LockUserRequest(string? Reason, int? Days);

public record WarnReportRequest(string? Reason);
