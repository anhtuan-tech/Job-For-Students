using System;
using System.Collections.Generic;

namespace JobForStudents.Models;

public class Review
{
    public int Id { get; set; }
    public int ContractId { get; set; }
    public int ReviewerId { get; set; }
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = null!;
    public int? ParentReviewId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsReported { get; set; } = false;

    // Navigation properties
    public virtual JobContract JobContract { get; set; } = null!;
    public virtual User Reviewer { get; set; } = null!;
    public virtual Review? ParentReview { get; set; }
    public virtual ICollection<Review> Replies { get; set; } = new List<Review>();
}
