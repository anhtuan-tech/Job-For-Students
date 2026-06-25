using JobForStudents.Models;
using System.Collections.Generic;

namespace JobForStudents.Models
{
    public class JobSearchViewModel
    {
        public string? Keyword { get; set; }
        public string? Category { get; set; }
        public BudgetType? BudgetType { get; set; }
        public ExperienceLevel? ExperienceLevel { get; set; }
        
        public List<JobPost> Jobs { get; set; } = new List<JobPost>();
        
        // Check if a job is saved by the current user
        public List<int> SavedJobIds { get; set; } = new List<int>();
    }
}
