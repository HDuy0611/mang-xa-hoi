using System.Net;
using System.Net.Mail;

namespace NovaApi.Services;

public class MailService(IConfiguration configuration, ILogger<MailService> logger)
{
    public async Task SendPasswordResetEmailAsync(string to, string resetLink)
    {
        var host = configuration["Smtp:Host"];

        if (string.IsNullOrEmpty(host))
        {
            logger.LogInformation(
                "[mailer] SMTP chua duoc cau hinh (thieu Smtp:Host). Link dat lai mat khau cho {To}: {ResetLink}",
                to, resetLink);
            return;
        }

        var port = configuration.GetValue("Smtp:Port", 587);
        var secure = configuration.GetValue("Smtp:Secure", false);
        var user = configuration["Smtp:User"];
        var pass = configuration["Smtp:Pass"];
        var from = configuration["Smtp:From"] ?? "NOVA <no-reply@nova.local>";

        using var client = new SmtpClient(host, port) { EnableSsl = secure };
        if (!string.IsNullOrEmpty(user))
        {
            client.Credentials = new NetworkCredential(user, pass);
        }

        using var message = new MailMessage
        {
            From = new MailAddress(from),
            Subject = "Đặt lại mật khẩu NOVA",
            IsBodyHtml = true,
            Body = $"""
                <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản NOVA của bạn.</p>
                <p><a href="{resetLink}">Nhấn vào đây để đặt lại mật khẩu</a> (liên kết hết hạn sau 1 giờ).</p>
                <p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
                """,
        };
        message.To.Add(to);

        await client.SendMailAsync(message);
    }
}
