using Microsoft.AspNetCore.SignalR;

namespace NovaApi.Hubs;

public class ClaimUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User?.FindFirst("id")?.Value;
}
