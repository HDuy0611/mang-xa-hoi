using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using NovaApi.Data;
using NovaApi.DTOs;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminAuthController(DbConnectionFactory db, IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Email?.Trim();
        var password = request.Password;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            return BadRequest(new MessageResponse("Vui lòng nhập email và mật khẩu."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var user = await connection.QuerySingleOrDefaultAsync<(int Id, string Name, string Username, string Email, string? PasswordHash, string Role)?>(
            "SELECT id, name, username, email, password_hash AS PasswordHash, role AS Role FROM users WHERE email = @email",
            new { email });

        if (user is null || user.Value.Role != "admin" || user.Value.PasswordHash is null)
            return Unauthorized(new MessageResponse("Email hoặc mật khẩu không đúng."));

        if (!BCrypt.Net.BCrypt.Verify(password, user.Value.PasswordHash))
            return Unauthorized(new MessageResponse("Email hoặc mật khẩu không đúng."));

        var token = GenerateJwt(user.Value.Id, user.Value.Email);
        return Ok(new
        {
            token,
            user = new UserResponse(user.Value.Id, user.Value.Name, user.Value.Username, user.Value.Email, user.Value.Role),
        });
    }

    private string GenerateJwt(int userId, string email)
    {
        var secret = configuration["Jwt:Secret"]!;
        var expiresInDays = configuration.GetValue("Jwt:ExpiresInDays", 7);

        var claims = new[]
        {
            new Claim("id", userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiresInDays),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
