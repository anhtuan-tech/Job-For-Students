namespace JobForStudents.Models;

public class DashboardViewModel
{
    public List<JobViewModel> Jobs { get; set; } = [];
    public List<UserViewModel> TopFreelancers { get; set; } = [];
    public decimal TotalEarnings { get; set; } = 2450000m;
    public int CompletedJobsCount { get; set; } = 12;
    public string CurrentUserName { get; set; } = "Khách";
    public string CurrentUserAvatarUrl { get; set; } = string.Empty;
}
