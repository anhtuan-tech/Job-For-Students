using System;
using System.Collections.Generic;

namespace JobForStudents.Models;

public class Wallet
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal Balance { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
