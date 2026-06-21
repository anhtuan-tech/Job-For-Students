using System;

namespace JobForStudents.Models;

public class Certificate
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string CertificateName { get; set; } = null!;
    public string Organization { get; set; } = null!;
    public DateTime IssuedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? CredentialUrl { get; set; } // acts as CredentialUrl/FilePath

    // Navigation property
    public virtual StudentProfile StudentProfile { get; set; } = null!;
}
