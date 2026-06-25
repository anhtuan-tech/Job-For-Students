using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobForStudents.Migrations
{
    /// <inheritdoc />
    public partial class AddExperienceToStudentProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Experience",
                table: "StudentProfiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Experience",
                table: "StudentProfiles");
        }
    }
}
