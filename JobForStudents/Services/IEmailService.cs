using System.Threading.Tasks;

namespace JobForStudents.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}
