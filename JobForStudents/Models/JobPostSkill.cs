namespace JobForStudents.Models;

public class JobPostSkill
{
    public int JobPostId { get; set; }
    public int SkillId { get; set; }

    // Navigation properties
    public virtual JobPost JobPost { get; set; } = null!;
    public virtual Skill Skill { get; set; } = null!;
}
