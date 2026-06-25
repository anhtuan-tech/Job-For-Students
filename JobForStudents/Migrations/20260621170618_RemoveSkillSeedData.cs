using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSkillSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Skills",
                keyColumn: "Id",
                keyValue: 12);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
