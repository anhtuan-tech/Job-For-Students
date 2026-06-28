using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class AddCvToStudentProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CvName",
                table: "StudentProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CvUrl",
                table: "StudentProfiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CvName",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "CvUrl",
                table: "StudentProfiles");
        }
    }
}
