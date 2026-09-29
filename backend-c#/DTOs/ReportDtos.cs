namespace NovaApi.DTOs;

public record CreateReportRequest(string? TargetType, int? TargetId, string? Reason);
