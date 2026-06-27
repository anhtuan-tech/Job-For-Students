using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class AddIsVipToJobPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVip",
                table: "JobPosts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 1,
                column: "IsActive",
                value: false);

            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Benefits", "Description", "JobPostLimit", "Name", "Price" },
                values: new object[] { "10 tin tuyển dụng;Hiển thị nhãn Premium nổi bật;Ghim bài đăng lên đầu trang chủ;Truy cập hồ sơ ứng viên không giới hạn", "Gói tối ưu cho doanh nghiệp vừa và nhỏ, nâng cao hiển thị.", 10, "Business Premium", 99000m });

            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Benefits", "Description", "DurationDays", "JobPostLimit", "Name", "Price" },
                values: new object[] { "1 tin tuyển dụng với độ ưu tiên cao nhất;Bài đăng giới hạn 7 ngày;Sử dụng 1 lần", "Đăng 1 bài với độ ưu tiên cao nhất, giới hạn trong 7 ngày.", 7, 1, "Business VIP", 30000m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVip",
                table: "JobPosts");

            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 1,
                column: "IsActive",
                value: true);

            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Benefits", "Description", "JobPostLimit", "Name", "Price" },
                values: new object[] { "15 tin tuyển dụng;Ưu tiên hiển thị tin;Xem ứng viên từng tin;Thông báo tuyển dụng nâng cao", "Gói tăng trưởng cho doanh nghiệp tuyển nhiều vị trí.", 15, "Business Growth", 299000m });

            migrationBuilder.UpdateData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Benefits", "Description", "DurationDays", "JobPostLimit", "Name", "Price" },
                values: new object[] { "60 tin tuyển dụng;Ưu tiên cao;Trang doanh nghiệp nổi bật;Lịch sử thanh toán chi tiết", "Gói chuyên nghiệp cho chiến dịch tuyển dụng liên tục.", 90, 60, "Business Pro", 799000m });
        }
    }
}
