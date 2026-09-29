namespace NovaApi.Services;

public class UploadService(IWebHostEnvironment env, IConfiguration configuration)
{
    // Mặc định lưu trong backend-c#/uploads; đổi được qua Uploads:Path (đường dẫn tương đối tính từ thư mục backend-c#)
    public static string ResolveUploadsPath(IWebHostEnvironment env, IConfiguration configuration)
    {
        var path = Path.GetFullPath(Path.Combine(env.ContentRootPath, configuration["Uploads:Path"] ?? "uploads"));
        Directory.CreateDirectory(path);
        return path;
    }

    public class UploadResult
    {
        public bool Success { get; init; }
        public string? Url { get; init; }
        public string? Error { get; init; }
    }

    public async Task<UploadResult> SaveImageAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return new UploadResult { Success = false, Error = "Vui lòng chọn ảnh." };

        if (!file.ContentType.StartsWith("image/"))
            return new UploadResult { Success = false, Error = "Chỉ được tải lên file ảnh." };

        var uploadsPath = ResolveUploadsPath(env, configuration);

        var ext = Path.GetExtension(file.FileName);
        var uniqueName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Random.Shared.Next(1_000_000_000)}{ext}";
        var filePath = Path.Combine(uploadsPath, uniqueName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return new UploadResult { Success = true, Url = $"/uploads/{uniqueName}" };
    }
}
