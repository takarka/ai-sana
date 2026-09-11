using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CraftAi.Modules.Content.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "content");

            migrationBuilder.CreateTable(
                name: "sections",
                schema: "content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    grade = table.Column<int>(type: "integer", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sections", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "lessons",
                schema: "content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lessons", x => x.id);
                    table.ForeignKey(
                        name: "fk_lessons_sections_section_id",
                        column: x => x.section_id,
                        principalSchema: "content",
                        principalTable: "sections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lesson_steps",
                schema: "content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lesson_steps", x => x.id);
                    table.ForeignKey(
                        name: "fk_lesson_steps_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "content",
                        principalTable: "lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "questions",
                schema: "content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_step_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    payload = table.Column<string>(type: "jsonb", nullable: false),
                    answer_key = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_questions", x => x.id);
                    table.ForeignKey(
                        name: "fk_questions_lesson_steps_lesson_step_id",
                        column: x => x.lesson_step_id,
                        principalSchema: "content",
                        principalTable: "lesson_steps",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "step_materials",
                schema: "content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_step_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_step_materials", x => x.id);
                    table.ForeignKey(
                        name: "fk_step_materials_lesson_steps_lesson_step_id",
                        column: x => x.lesson_step_id,
                        principalSchema: "content",
                        principalTable: "lesson_steps",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_lesson_steps_lesson_id_position",
                schema: "content",
                table: "lesson_steps",
                columns: new[] { "lesson_id", "position" });

            migrationBuilder.CreateIndex(
                name: "ix_lessons_section_id",
                schema: "content",
                table: "lessons",
                column: "section_id");

            migrationBuilder.CreateIndex(
                name: "ix_questions_lesson_step_id",
                schema: "content",
                table: "questions",
                column: "lesson_step_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sections_grade",
                schema: "content",
                table: "sections",
                column: "grade");

            migrationBuilder.CreateIndex(
                name: "ix_step_materials_lesson_step_id_position",
                schema: "content",
                table: "step_materials",
                columns: new[] { "lesson_step_id", "position" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "questions",
                schema: "content");

            migrationBuilder.DropTable(
                name: "step_materials",
                schema: "content");

            migrationBuilder.DropTable(
                name: "lesson_steps",
                schema: "content");

            migrationBuilder.DropTable(
                name: "lessons",
                schema: "content");

            migrationBuilder.DropTable(
                name: "sections",
                schema: "content");
        }
    }
}
