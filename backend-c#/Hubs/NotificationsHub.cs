using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NovaApi.Hubs;

[Authorize]
public class NotificationsHub : Hub
{
}
