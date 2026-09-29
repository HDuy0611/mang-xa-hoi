namespace NovaApi.DTOs;

public record UpdateSettingsRequest(
    bool? IsPrivate,
    bool? ShowOnlineStatus,
    bool? ShowActivity,
    bool? NotifyPush,
    bool? NotifyEmail,
    bool? NotifySms,
    string? Theme);
