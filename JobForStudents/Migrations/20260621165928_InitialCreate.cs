using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BusinessProfiles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    TaxCode = table.Column<string>(type: "text", nullable: true),
                    WebsiteUrl = table.Column<string>(type: "text", nullable: true),
                    CompanySize = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Industry = table.Column<string>(type: "text", nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessProfiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_BusinessProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SenderId = table.Column<int>(type: "integer", nullable: false),
                    ReceiverId = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Users_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentProfiles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    CoverImageUrl = table.Column<string>(type: "text", nullable: true),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    University = table.Column<string>(type: "text", nullable: true),
                    Major = table.Column<string>(type: "text", nullable: true),
                    GPA = table.Column<double>(type: "double precision", nullable: true),
                    GraduationYear = table.Column<int>(type: "integer", nullable: true),
                    Gender = table.Column<string>(type: "text", nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProfiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_StudentProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Wallets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Balance = table.Column<decimal>(type: "numeric", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wallets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wallets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Requirements = table.Column<string>(type: "text", nullable: true),
                    Benefits = table.Column<string>(type: "text", nullable: true),
                    BudgetType = table.Column<string>(type: "text", nullable: false),
                    Budget = table.Column<decimal>(type: "numeric", nullable: false),
                    ExperienceLevelRequired = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Deadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPosts_BusinessProfiles_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "BusinessProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Certificates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    CertificateName = table.Column<string>(type: "text", nullable: false),
                    Organization = table.Column<string>(type: "text", nullable: false),
                    IssuedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CredentialUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Certificates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Certificates_StudentProfiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "StudentProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PortfolioProjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ProjectUrl = table.Column<string>(type: "text", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RoleInProject = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PortfolioProjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PortfolioProjects_StudentProfiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "StudentProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentSkills",
                columns: table => new
                {
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    SkillId = table.Column<int>(type: "integer", nullable: false),
                    ExperienceMonths = table.Column<int>(type: "integer", nullable: false),
                    SkillLevel = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentSkills", x => new { x.StudentId, x.SkillId });
                    table.ForeignKey(
                        name: "FK_StudentSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentSkills_StudentProfiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "StudentProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WalletId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    TransactionCode = table.Column<string>(type: "text", nullable: false),
                    PaymentMethod = table.Column<string>(type: "text", nullable: true),
                    BankAccountNumber = table.Column<string>(type: "text", nullable: true),
                    BankAccountName = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    AdminNote = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_Wallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobBids",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobPostId = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    BidAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    EstimatedDays = table.Column<int>(type: "integer", nullable: false),
                    Proposal = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobBids", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobBids_JobPosts_JobPostId",
                        column: x => x.JobPostId,
                        principalTable: "JobPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobBids_StudentProfiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "StudentProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobContracts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JobPostId = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    BusinessId = table.Column<int>(type: "integer", nullable: false),
                    FinalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    DeliverableContent = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobContracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobContracts_BusinessProfiles_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "BusinessProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_JobContracts_JobPosts_JobPostId",
                        column: x => x.JobPostId,
                        principalTable: "JobPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_JobContracts_StudentProfiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "StudentProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "JobPostSkills",
                columns: table => new
                {
                    JobPostId = table.Column<int>(type: "integer", nullable: false),
                    SkillId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPostSkills", x => new { x.JobPostId, x.SkillId });
                    table.ForeignKey(
                        name: "FK_JobPostSkills_JobPosts_JobPostId",
                        column: x => x.JobPostId,
                        principalTable: "JobPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobPostSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavedJobs",
                columns: table => new
                {
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    JobPostId = table.Column<int>(type: "integer", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedJobs", x => new { x.StudentId, x.JobPostId });
                    table.ForeignKey(
                        name: "FK_SavedJobs_JobPosts_JobPostId",
                        column: x => x.JobPostId,
                        principalTable: "JobPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedJobs_StudentProfiles_StudentId",
                        column: x => x.StudentId,
                        principalTable: "StudentProfiles",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContractId = table.Column<int>(type: "integer", nullable: false),
                    ReviewerId = table.Column<int>(type: "integer", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    ParentReviewId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_JobContracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "JobContracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Reviews_ParentReviewId",
                        column: x => x.ParentReviewId,
                        principalTable: "Reviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Skills",
                columns: new[] { "Id", "Category", "Name" },
                values: new object[,]
                {
                    { 1, "Thiết kế", "Thiết kế Banner" },
                    { 2, "Thiết kế", "Thiết kế Logo" },
                    { 3, "Dịch thuật", "Dịch thuật Anh-Việt" },
                    { 4, "Dịch thuật", "Dịch thuật Trung-Việt" },
                    { 5, "Làm slide", "Thiết kế slide PowerPoint" },
                    { 6, "Làm slide", "Làm slide báo cáo" },
                    { 7, "Viết content", "Viết bài chuẩn SEO" },
                    { 8, "Viết content", "Viết content Fanpage" },
                    { 9, "Code web", "Lập trình React/Vue" },
                    { 10, "Code web", "Lập trình ASP.NET Core" },
                    { 11, "Edit video", "Edit Video CapCut" },
                    { 12, "Edit video", "Edit Video Tiktok" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "IsDeleted", "PasswordHash", "Phone", "Role", "Status" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "student1@gmail.com", false, "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "0912345671", "Student", "Active" },
                    { 2, new DateTime(2026, 1, 5, 0, 0, 0, 0, DateTimeKind.Utc), "student2@gmail.com", false, "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "0912345672", "Student", "Active" },
                    { 3, new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "business1@gmail.com", false, "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "0912345673", "Business", "Active" },
                    { 4, new DateTime(2026, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), "business2@gmail.com", false, "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "0912345674", "Business", "Active" },
                    { 5, new DateTime(2026, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "student3@gmail.com", false, "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "0912345675", "Student", "Active" }
                });

            migrationBuilder.InsertData(
                table: "BusinessProfiles",
                columns: new[] { "UserId", "Address", "CompanyName", "CompanySize", "Industry", "IsVerified", "LogoUrl", "TaxCode", "WebsiteUrl" },
                values: new object[,]
                {
                    { 3, null, "Công ty TNHH Giải pháp Công nghệ J4S", null, "Công nghệ thông tin", true, null, null, null },
                    { 4, null, "Studio Sáng tạo Hải Đăng", null, "Truyền thông & Quảng cáo", true, null, null, null }
                });

            migrationBuilder.InsertData(
                table: "StudentProfiles",
                columns: new[] { "UserId", "AvatarUrl", "Bio", "CoverImageUrl", "DateOfBirth", "FullName", "GPA", "Gender", "GraduationYear", "Major", "University" },
                values: new object[,]
                {
                    { 1, null, "Sinh viên chuyên ngành CNTT trường Đại học Bách Khoa, có kinh nghiệm lập trình React, ASP.NET Core.", null, new DateTime(2004, 5, 12, 0, 0, 0, 0, DateTimeKind.Utc), "Trần Minh Quang", 3.6000000000000001, "Nam", 2027, "Công nghệ thông tin", "Đại học Bách Khoa Hà Nội" },
                    { 2, null, "Sinh viên Thiết kế đồ họa trường Đại học Mỹ thuật Công nghiệp. Đam mê thiết kế logo, banner, giao diện người dùng UI/UX.", null, new DateTime(2003, 10, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Nguyễn Thảo Linh", 3.7999999999999998, "Nữ", 2026, "Thiết kế đồ họa", "Đại học Mỹ thuật Công nghiệp" },
                    { 5, null, "Chuyên viên làm slide slide PowerPoint, slide thuyết trình chuyên nghiệp, thuyết trình dự án tốt nghiệp.", null, new DateTime(2004, 2, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Lê Hải Đăng", 3.5, "Nam", 2026, "Kinh tế quốc tế", "Đại học Ngoại Thương" }
                });

            migrationBuilder.InsertData(
                table: "Wallets",
                columns: new[] { "Id", "Balance", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { 1, 500000m, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { 2, 1200000m, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), 2 },
                    { 3, 25000000m, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), 3 },
                    { 4, 10000000m, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), 4 },
                    { 5, 0m, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), 5 }
                });

            migrationBuilder.InsertData(
                table: "JobPosts",
                columns: new[] { "Id", "Benefits", "Budget", "BudgetType", "BusinessId", "CreatedAt", "Deadline", "Description", "ExperienceLevelRequired", "IsDeleted", "Location", "Quantity", "Requirements", "Status", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "Hỗ trợ tài liệu thực tập, có cơ hội làm việc chính thức sau khi tốt nghiệp.", 3500000m, "Fixed", 3, new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Cần một bạn sinh viên thiết kế và lập trình website giới thiệu sản phẩm doanh nghiệp bằng ASP.NET Core MVC. Yêu cầu giao diện thân thiện, chuẩn SEO.", "No_Experience", false, "Hà Nội (Hybrid)", 1, "Biết ASP.NET Core, HTML/CSS, SQL Server/PostgreSQL. Chủ động trong công việc.", "Open", "Lập trình website giới thiệu sản phẩm bằng ASP.NET Core", new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Thưởng thêm nếu hoàn thành xuất sắc và đúng hạn.", 1500000m, "Fixed", 4, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 6, 30, 0, 0, 0, 0, DateTimeKind.Utc), "Cần thiết kế logo và 5 banner quảng cáo Facebook cho cửa hàng quần áo thời trang sinh viên.", "Mid_Level", false, "Online", 1, "Thành thạo Photoshop, Illustrator. Gửi portfolio đính kèm.", "Open", "Thiết kế bộ nhận diện thương hiệu logo & banner", new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Môi trường học hỏi năng động, trả nhuận bút theo bài.", 100000m, "Hourly", 3, new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 5, 0, 0, 0, 0, DateTimeKind.Utc), "Viết 10 bài viết chuẩn SEO độ dài từ 1000-1500 từ về các chủ đề: Cloud VPS, hosting, máy chủ ảo, lập trình web.", "No_Experience", false, "Online", 2, "Khả năng viết tốt, chuẩn SEO. Không sao chép, sử dụng AI hợp lý.", "Open", "Viết bài chuẩn SEO ngành Công nghệ, Hosting", new DateTime(2026, 6, 21, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "Cung cấp mẫu thử sản phẩm miễn phí.", 800000m, "Fixed", 4, new DateTime(2026, 6, 18, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 6, 28, 0, 0, 0, 0, DateTimeKind.Utc), "Cần edit 5 video Tiktok ngắn dài khoảng 30s-60s từ tư liệu thô có sẵn. Chủ đề review phụ kiện điện thoại.", "No_Experience", false, "Online", 1, "Sử dụng tốt CapCut hoặc Premiere Pro. Bắt trend nhạc tốt.", "Open", "Edit video Tiktok ngắn dạng review sản phẩm", new DateTime(2026, 6, 18, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "StudentSkills",
                columns: new[] { "SkillId", "StudentId", "ExperienceMonths", "SkillLevel" },
                values: new object[,]
                {
                    { 9, 1, 12, "Intermediate" },
                    { 10, 1, 6, "Beginner" },
                    { 1, 2, 18, "Intermediate" },
                    { 2, 2, 24, "Expert" },
                    { 5, 5, 12, "Intermediate" }
                });

            migrationBuilder.InsertData(
                table: "JobPostSkills",
                columns: new[] { "JobPostId", "SkillId" },
                values: new object[,]
                {
                    { 1, 9 },
                    { 1, 10 },
                    { 2, 1 },
                    { 2, 2 },
                    { 3, 7 },
                    { 3, 8 },
                    { 4, 11 },
                    { 4, 12 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_StudentId",
                table: "Certificates",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobBids_JobPostId",
                table: "JobBids",
                column: "JobPostId");

            migrationBuilder.CreateIndex(
                name: "IX_JobBids_StudentId",
                table: "JobBids",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobContracts_BusinessId",
                table: "JobContracts",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_JobContracts_JobPostId",
                table: "JobContracts",
                column: "JobPostId");

            migrationBuilder.CreateIndex(
                name: "IX_JobContracts_StudentId",
                table: "JobContracts",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobPosts_BusinessId",
                table: "JobPosts",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_JobPostSkills_SkillId",
                table: "JobPostSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ReceiverId",
                table: "Messages",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SenderId",
                table: "Messages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PortfolioProjects_StudentId",
                table: "PortfolioProjects",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ContractId",
                table: "Reviews",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ParentReviewId",
                table: "Reviews",
                column: "ParentReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReviewerId",
                table: "Reviews",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedJobs_JobPostId",
                table: "SavedJobs",
                column: "JobPostId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentSkills_SkillId",
                table: "StudentSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_WalletId",
                table: "Transactions",
                column: "WalletId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Phone",
                table: "Users",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_UserId",
                table: "Wallets",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Certificates");

            migrationBuilder.DropTable(
                name: "JobBids");

            migrationBuilder.DropTable(
                name: "JobPostSkills");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "PortfolioProjects");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "SavedJobs");

            migrationBuilder.DropTable(
                name: "StudentSkills");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "JobContracts");

            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.DropTable(
                name: "Wallets");

            migrationBuilder.DropTable(
                name: "JobPosts");

            migrationBuilder.DropTable(
                name: "StudentProfiles");

            migrationBuilder.DropTable(
                name: "BusinessProfiles");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
