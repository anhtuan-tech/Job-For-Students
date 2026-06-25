using JobForStudents.Models;
using System.Collections.Generic;

namespace JobForStudents.Models
{
    public class StudentProfileViewModel
    {
        public int StudentId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string ResumeUrl { get; set; } = string.Empty;

        // Masked or Unmasked fields based on permissions
        public bool IsContactMasked { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? FacebookLink { get; set; }
        public string? LinkedInLink { get; set; }

        public List<string> Skills { get; set; } = new List<string>();
        public List<Review> Reviews { get; set; } = new List<Review>();
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
}
