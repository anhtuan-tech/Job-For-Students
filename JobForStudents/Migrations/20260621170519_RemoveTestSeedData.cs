using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTestSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 1, 9 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 1, 10 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 2, 1 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 2, 2 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 3, 7 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 3, 8 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 4, 11 });

            migrationBuilder.DeleteData(
                table: "JobPostSkills",
                keyColumns: new[] { "JobPostId", "SkillId" },
                keyValues: new object[] { 4, 12 });

            migrationBuilder.DeleteData(
                table: "StudentSkills",
                keyColumns: new[] { "SkillId", "StudentId" },
                keyValues: new object[] { 9, 1 });

            migrationBuilder.DeleteData(
                table: "StudentSkills",
                keyColumns: new[] { "SkillId", "StudentId" },
                keyValues: new object[] { 10, 1 });

            migrationBuilder.DeleteData(
                table: "StudentSkills",
                keyColumns: new[] { "SkillId", "StudentId" },
                keyValues: new object[] { 1, 2 });

            migrationBuilder.DeleteData(
                table: "StudentSkills",
                keyColumns: new[] { "SkillId", "StudentId" },
                keyValues: new object[] { 2, 2 });

            migrationBuilder.DeleteData(
                table: "StudentSkills",
                keyColumns: new[] { "SkillId", "StudentId" },
                keyValues: new object[] { 5, 5 });

            migrationBuilder.DeleteData(
                table: "Wallets",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Wallets",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Wallets",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Wallets",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Wallets",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "JobPosts",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "JobPosts",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "JobPosts",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "JobPosts",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "StudentProfiles",
                keyColumn: "UserId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "StudentProfiles",
                keyColumn: "UserId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "StudentProfiles",
                keyColumn: "UserId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "BusinessProfiles",
                keyColumn: "UserId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "BusinessProfiles",
                keyColumn: "UserId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
