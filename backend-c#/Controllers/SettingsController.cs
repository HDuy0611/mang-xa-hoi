using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Extensions;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController(DbConnectionFactory db) : ControllerBase
{
    private static readonly object Defaults = new
    {
        isPrivate = false,
        showOnlineStatus = true,
        showActivity = true,
        notifyPush = true,
        notifyEmail = true,
        notifySms = false,
        theme = "light",
    };

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var me = this.CurrentUserId();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var row = await connection.QuerySingleOrDefaultAsync(
            "SELECT * FROM user_settings WHERE user_id = @me", new { me });

        if (row is null)
            return Ok(new { settings = Defaults });

        var s = (IDictionary<string, object>)row;
        return Ok(new
        {
            settings = new
            {
                isPrivate = Convert.ToBoolean(s["is_private"]),
                showOnlineStatus = Convert.ToBoolean(s["show_online_status"]),
                showActivity = Convert.ToBoolean(s["show_activity"]),
                notifyPush = Convert.ToBoolean(s["notify_push"]),
                notifyEmail = Convert.ToBoolean(s["notify_email"]),
                notifySms = Convert.ToBoolean(s["notify_sms"]),
                theme = s["theme"].ToString(),
            },
        });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateSettingsRequest request)
    {
        var me = this.CurrentUserId();

        var isPrivate = request.IsPrivate ?? false;
        var showOnlineStatus = request.ShowOnlineStatus ?? true;
        var showActivity = request.ShowActivity ?? true;
        var notifyPush = request.NotifyPush ?? true;
        var notifyEmail = request.NotifyEmail ?? true;
        var notifySms = request.NotifySms ?? false;
        var theme = request.Theme == "dark" ? "dark" : "light";

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        await connection.ExecuteAsync(
            @"INSERT INTO user_settings
                (user_id, is_private, show_online_status, show_activity, notify_push, notify_email, notify_sms, theme)
              VALUES (@me, @isPrivate, @showOnlineStatus, @showActivity, @notifyPush, @notifyEmail, @notifySms, @theme)
              ON DUPLICATE KEY UPDATE
                is_private = VALUES(is_private),
                show_online_status = VALUES(show_online_status),
                show_activity = VALUES(show_activity),
                notify_push = VALUES(notify_push),
                notify_email = VALUES(notify_email),
                notify_sms = VALUES(notify_sms),
                theme = VALUES(theme)",
            new { me, isPrivate, showOnlineStatus, showActivity, notifyPush, notifyEmail, notifySms, theme });

        return Ok(new { settings = new { isPrivate, showOnlineStatus, showActivity, notifyPush, notifyEmail, notifySms, theme } });
    }
}
