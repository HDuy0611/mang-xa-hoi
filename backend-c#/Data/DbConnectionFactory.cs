using MySqlConnector;

namespace NovaApi.Data;

public class DbConnectionFactory(IConfiguration configuration)
{
    private readonly string _connectionString = configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("Missing ConnectionStrings:Default");

    public MySqlConnection CreateConnection() => new(_connectionString);
}
