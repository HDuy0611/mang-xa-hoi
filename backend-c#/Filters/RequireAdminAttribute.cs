using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using NovaApi.Data;
using NovaApi.DTOs;

namespace NovaApi.Filters;

public class RequireAdminAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var idClaim = context.HttpContext.User.FindFirst("id")?.Value;
        if (idClaim is null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<DbConnectionFactory>();
        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var role = await connection.QuerySingleOrDefaultAsync<string?>(
            "SELECT role FROM users WHERE id = @id", new { id = int.Parse(idClaim) });

        if (role != "admin")
        {
            context.Result = new ObjectResult(new MessageResponse("Bạn không có quyền truy cập chức năng này."))
            {
                StatusCode = 403,
            };
        }
    }
}
