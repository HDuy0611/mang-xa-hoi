using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using NovaApi.Data;
using NovaApi.DTOs;
using NovaApi.Models;
using NovaApi.Services;

namespace NovaApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    DbConnectionFactory db,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    MailService mailService) : ControllerBase
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var name = request.Name?.Trim();
        var email = request.Email?.Trim();
        var password = request.Password;

        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            return BadRequest(new MessageResponse("Vui lòng nhập đầy đủ họ tên, email và mật khẩu."));

        if (!EmailRegex.IsMatch(email))
            return BadRequest(new MessageResponse("Email không hợp lệ."));

        if (password.Length < 6)
            return BadRequest(new MessageResponse("Mật khẩu phải có ít nhất 6 ký tự."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var username = await GenerateUniqueUsernameAsync(connection, email.Split('@')[0]);
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        try
        {
            var id = await connection.QuerySingleAsync<int>(
                @"INSERT INTO users (name, username, email, password_hash) VALUES (@name, @username, @email, @passwordHash);
                  SELECT LAST_INSERT_ID();",
                new { name, username, email, passwordHash });

            return StatusCode(201, new { user = new UserResponse(id, name, username, email, "user") });
        }
        catch (MySqlException ex) when (ex.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
        {
            return Conflict(new MessageResponse("Email này đã được đăng ký."));
        }
        catch (Exception)
        {
            return StatusCode(500, new MessageResponse("Có lỗi xảy ra, vui lòng thử lại."));
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Email?.Trim();
        var password = request.Password;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            return BadRequest(new MessageResponse("Vui lòng nhập email và mật khẩu."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var user = await connection.QuerySingleOrDefaultAsync<User>(
            @"SELECT id, name, username, email, password_hash AS PasswordHash, role AS Role,
                     is_locked AS IsLocked, locked_until AS LockedUntil, locked_reason AS LockedReason
              FROM users WHERE email = @email",
            new { email });

        if (user is null)
            return Unauthorized(new MessageResponse("Email hoặc mật khẩu không đúng."));

        if (user.PasswordHash is null)
            return Unauthorized(new MessageResponse("Tài khoản này đăng nhập bằng Google/Facebook, vui lòng dùng nút tương ứng."));

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return Unauthorized(new MessageResponse("Email hoặc mật khẩu không đúng."));

        if (user.Role == "admin")
            return Unauthorized(new MessageResponse("Email hoặc mật khẩu không đúng."));

        var lockMessage = await CheckLockMessageAsync(connection, user);
        if (lockMessage is not null)
            return StatusCode(403, new MessageResponse(lockMessage));

        await ReactivateIfNeededAsync(connection, user.Id);

        return Ok(new { token = GenerateJwt(user), user = new UserResponse(user.Id, user.Name, user.Username, user.Email, user.Role) });
    }

    [HttpPost("google")]
    public async Task<IActionResult> Google([FromBody] GoogleLoginRequest request)
    {
        if (string.IsNullOrEmpty(request.AccessToken))
            return BadRequest(new MessageResponse("Thiếu thông tin đăng nhập Google."));

        var clientId = configuration["Google:ClientId"];
        if (string.IsNullOrEmpty(clientId))
            return StatusCode(501, new MessageResponse("Đăng nhập Google chưa được cấu hình (thiếu Google:ClientId trong cấu hình)."));

        // Frontend dùng popup OAuth2 nên gửi lên access token, không phải ID token.
        // tokeninfo xác nhận token được cấp cho đúng Client ID của SUNSET, userinfo lấy thông tin tài khoản.
        var client = httpClientFactory.CreateClient();
        string googleId, googleEmail, googleName;
        string? googlePicture;
        try
        {
            var infoRes = await client.GetAsync(
                $"https://oauth2.googleapis.com/tokeninfo?access_token={Uri.EscapeDataString(request.AccessToken)}");
            if (!infoRes.IsSuccessStatusCode)
                return Unauthorized(new MessageResponse("Đăng nhập Google thất bại."));
            using var infoDoc = JsonDocument.Parse(await infoRes.Content.ReadAsStringAsync());
            var aud = infoDoc.RootElement.TryGetProperty("aud", out var audProp) ? audProp.GetString() : null;
            if (aud != clientId)
                return Unauthorized(new MessageResponse("Đăng nhập Google thất bại."));

            using var profileReq = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            profileReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.AccessToken);
            var profileRes = await client.SendAsync(profileReq);
            if (!profileRes.IsSuccessStatusCode)
                return Unauthorized(new MessageResponse("Đăng nhập Google thất bại."));
            using var profileDoc = JsonDocument.Parse(await profileRes.Content.ReadAsStringAsync());
            var root = profileDoc.RootElement;

            googleId = root.GetProperty("sub").GetString()!;
            googleEmail = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() ?? "" : "";
            googleName = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? googleEmail : googleEmail;
            googlePicture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;
        }
        catch (Exception)
        {
            return Unauthorized(new MessageResponse("Đăng nhập Google thất bại."));
        }

        if (string.IsNullOrEmpty(googleEmail))
            return Unauthorized(new MessageResponse("Đăng nhập Google thất bại."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var user = await FindOrCreateOAuthUserAsync(connection, "google_id", googleId,
            googleEmail, googleName, googlePicture);

        if (user.Role == "admin")
            return Unauthorized(new MessageResponse("Đăng nhập Google thất bại."));

        var lockMessage = await CheckLockMessageAsync(connection, user);
        if (lockMessage is not null)
            return StatusCode(403, new MessageResponse(lockMessage));

        await ReactivateIfNeededAsync(connection, user.Id);

        return Ok(new { token = GenerateJwt(user), user = new UserResponse(user.Id, user.Name, user.Username, user.Email, user.Role) });
    }

    [HttpPost("facebook")]
    public async Task<IActionResult> Facebook([FromBody] FacebookLoginRequest request)
    {
        if (string.IsNullOrEmpty(request.AccessToken))
            return BadRequest(new MessageResponse("Thiếu thông tin đăng nhập Facebook."));

        var appId = configuration["Facebook:AppId"];
        var appSecret = configuration["Facebook:AppSecret"];
        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret))
            return StatusCode(501, new MessageResponse("Đăng nhập Facebook chưa được cấu hình (thiếu Facebook:AppId/AppSecret trong cấu hình)."));

        var client = httpClientFactory.CreateClient();
        var appToken = $"{appId}|{appSecret}";

        try
        {
            var debugJson = await client.GetStringAsync(
                $"https://graph.facebook.com/debug_token?input_token={Uri.EscapeDataString(request.AccessToken)}&access_token={Uri.EscapeDataString(appToken)}");
            using var debugDoc = JsonDocument.Parse(debugJson);
            var data = debugDoc.RootElement.GetProperty("data");
            var isValid = data.TryGetProperty("is_valid", out var validProp) && validProp.GetBoolean();
            var tokenAppId = data.TryGetProperty("app_id", out var appIdProp) ? appIdProp.GetString() : null;

            if (!isValid || tokenAppId != appId)
                return Unauthorized(new MessageResponse("Token Facebook không hợp lệ."));

            var profileJson = await client.GetStringAsync(
                $"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={Uri.EscapeDataString(request.AccessToken)}");
            using var profileDoc = JsonDocument.Parse(profileJson);
            var root = profileDoc.RootElement;

            if (!root.TryGetProperty("id", out var idProp))
                return Unauthorized(new MessageResponse("Không lấy được thông tin tài khoản Facebook."));

            var fbId = idProp.GetString()!;
            var fbEmail = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
            var fbName = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
            string? fbPicture = null;
            if (root.TryGetProperty("picture", out var pictureProp) &&
                pictureProp.TryGetProperty("data", out var picDataProp) &&
                picDataProp.TryGetProperty("url", out var picUrlProp))
            {
                fbPicture = picUrlProp.GetString();
            }

            if (string.IsNullOrEmpty(fbEmail))
                return Unauthorized(new MessageResponse("Tài khoản Facebook chưa cấp quyền chia sẻ email, không thể đăng nhập."));

            using var connection = db.CreateConnection();
            await connection.OpenAsync();

            var user = await FindOrCreateOAuthUserAsync(connection, "facebook_id", fbId, fbEmail, fbName ?? fbEmail, fbPicture);

            if (user.Role == "admin")
                return Unauthorized(new MessageResponse("Đăng nhập Facebook thất bại."));

            var lockMessage = await CheckLockMessageAsync(connection, user);
            if (lockMessage is not null)
                return StatusCode(403, new MessageResponse(lockMessage));

            await ReactivateIfNeededAsync(connection, user.Id);

            return Ok(new { token = GenerateJwt(user), user = new UserResponse(user.Id, user.Name, user.Username, user.Email, user.Role) });
        }
        catch (Exception)
        {
            return Unauthorized(new MessageResponse("Đăng nhập Facebook thất bại."));
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        const string genericMessage = "Nếu email này tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.";
        var email = request.Email?.Trim();

        if (string.IsNullOrEmpty(email))
            return BadRequest(new MessageResponse("Vui lòng nhập email."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var user = await connection.QuerySingleOrDefaultAsync<(int Id, string Email)?>(
            "SELECT id, email FROM users WHERE email = @email", new { email });

        if (user is not null)
        {
            var rawTokenBytes = RandomNumberGenerator.GetBytes(32);
            var rawToken = Convert.ToHexStringLower(rawTokenBytes);
            var tokenHash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
            var expiresAt = DateTime.UtcNow.AddHours(1);

            await connection.ExecuteAsync(
                "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (@userId, @tokenHash, @expiresAt)",
                new { userId = user.Value.Id, tokenHash, expiresAt });

            var frontendUrl = configuration["Frontend:Url"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={rawToken}";
            await mailService.SendPasswordResetEmailAsync(user.Value.Email, resetLink);
        }

        return Ok(new MessageResponse(genericMessage));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest(new MessageResponse("Thiếu thông tin đặt lại mật khẩu."));

        if (request.NewPassword.Length < 6)
            return BadRequest(new MessageResponse("Mật khẩu mới phải có ít nhất 6 ký tự."));

        using var connection = db.CreateConnection();
        await connection.OpenAsync();

        var tokenHash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));
        var reset = await connection.QuerySingleOrDefaultAsync<(int Id, int UserId)?>(
            @"SELECT id, user_id AS UserId FROM password_resets
              WHERE token_hash = @tokenHash AND used = FALSE AND expires_at > UTC_TIMESTAMP()",
            new { tokenHash });

        if (reset is null)
            return BadRequest(new MessageResponse("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await connection.ExecuteAsync("UPDATE users SET password_hash = @newHash WHERE id = @id",
            new { newHash, id = reset.Value.UserId });
        await connection.ExecuteAsync("UPDATE password_resets SET used = TRUE WHERE id = @id",
            new { id = reset.Value.Id });

        return Ok(new MessageResponse("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay."));
    }

    private static async Task<User> FindOrCreateOAuthUserAsync(
        MySqlConnection connection, string idColumn, string providerId, string email, string name, string? picture)
    {
        var byProviderId = await connection.QuerySingleOrDefaultAsync<User>(
            $@"SELECT id, name, username, email, avatar_url AS AvatarUrl, role AS Role,
                      is_locked AS IsLocked, locked_until AS LockedUntil, locked_reason AS LockedReason
               FROM users WHERE {idColumn} = @providerId",
            new { providerId });
        if (byProviderId is not null) return byProviderId;

        var byEmail = await connection.QuerySingleOrDefaultAsync<User>(
            @"SELECT id, name, username, email, avatar_url AS AvatarUrl, role AS Role,
                     is_locked AS IsLocked, locked_until AS LockedUntil, locked_reason AS LockedReason
              FROM users WHERE email = @email",
            new { email });
        if (byEmail is not null)
        {
            await connection.ExecuteAsync($"UPDATE users SET {idColumn} = @providerId WHERE id = @id",
                new { providerId, id = byEmail.Id });
            return byEmail;
        }

        var username = await GenerateUniqueUsernameAsync(connection, email.Split('@')[0]);
        var id = await connection.QuerySingleAsync<int>(
            $@"INSERT INTO users (name, username, email, avatar_url, {idColumn}) VALUES (@name, @username, @email, @picture, @providerId);
               SELECT LAST_INSERT_ID();",
            new { name, username, email, picture, providerId });

        return new User { Id = id, Name = name, Username = username, Email = email, AvatarUrl = picture };
    }

    private static async Task ReactivateIfNeededAsync(MySqlConnection connection, int userId)
    {
        await connection.ExecuteAsync(
            "UPDATE user_settings SET is_deactivated = FALSE WHERE user_id = @userId", new { userId });
    }

    private static async Task<string?> CheckLockMessageAsync(MySqlConnection connection, User user)
    {
        if (!user.IsLocked) return null;

        if (user.LockedUntil is not null && user.LockedUntil <= DateTime.UtcNow)
        {
            await connection.ExecuteAsync(
                "UPDATE users SET is_locked = FALSE, locked_until = NULL, locked_reason = NULL WHERE id = @id",
                new { id = user.Id });
            return null;
        }

        var reasonPart = string.IsNullOrEmpty(user.LockedReason) ? "" : $" Lý do: {user.LockedReason}.";

        if (user.LockedUntil is not null)
        {
            var until = user.LockedUntil.Value.ToString("dd/MM/yyyy");
            return $"Tài khoản của bạn đã bị khóa đến ngày {until}.{reasonPart} Vui lòng liên hệ quản trị viên.";
        }

        return $"Tài khoản của bạn đã bị khóa vĩnh viễn.{reasonPart} Vui lòng liên hệ quản trị viên.";
    }

    private static async Task<string> GenerateUniqueUsernameAsync(MySqlConnection connection, string baseName)
    {
        var cleanBase = Regex.Replace(baseName.ToLowerInvariant(), "[^a-z0-9_]", "");
        if (string.IsNullOrEmpty(cleanBase)) cleanBase = "user";

        var candidate = cleanBase;
        var suffix = 0;

        while (true)
        {
            var exists = await connection.QuerySingleOrDefaultAsync<int?>(
                "SELECT id FROM users WHERE username = @candidate", new { candidate });
            if (exists is null) return candidate;

            suffix += 1;
            candidate = $"{cleanBase}{suffix}";
        }
    }

    private string GenerateJwt(User user)
    {
        var secret = configuration["Jwt:Secret"]!;
        var expiresInDays = configuration.GetValue("Jwt:ExpiresInDays", 7);

        var claims = new[]
        {
            new Claim("id", user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
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
