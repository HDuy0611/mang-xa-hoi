using Microsoft.AspNetCore.Mvc;

namespace NovaApi.Extensions;

public static class ControllerExtensions
{
    public static int CurrentUserId(this ControllerBase controller) =>
        int.Parse(controller.User.FindFirst("id")!.Value);
}
