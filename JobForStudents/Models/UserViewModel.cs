namespace JobForStudents.Models;

public class UserViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Skill { get; set; } = string.Empty;
    public string MatchPercentage { get; set; } = string.Empty;
    public double Rating { get; set; }
    public int ReviewsCount { get; set; }
    public string Avatar { get; set; } = string.Empty;
}
