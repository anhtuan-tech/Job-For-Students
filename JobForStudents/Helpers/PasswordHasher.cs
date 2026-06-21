using System.Security.Cryptography;
using System.Text;

namespace JobForStudents.Helpers;

public static class PasswordHasher
{
    public static string HashPassword(string password)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        var builder = new StringBuilder();
        foreach (byte b in bytes)
        {
            builder.Append(b.ToString("x2"));
        }
        return builder.ToString();
    }

    public static bool VerifyPassword(string password, string hashedPassword)
    {
        string hash = HashPassword(password);
        return string.Equals(hash, hashedPassword, StringComparison.OrdinalIgnoreCase);
    }
}
