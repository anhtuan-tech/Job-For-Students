using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePremiumBenefits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 2,
                column: "Benefits",
                value: "10 tin tuyển dụng;Xem duyệt ứng viên;Truy cập hồ sơ ứng viên không giới hạn");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 2,
                column: "Benefits",
                value: "10 tin tuyển dụng;Hiển thị nhãn Premium nổi bật;Ghim bài đăng lên đầu trang chủ;Truy cập hồ sơ ứng viên không giới hạn");
        }
    }
}
