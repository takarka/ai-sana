using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CraftAi.Modules.Pisa.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "pisa");

            migrationBuilder.CreateTable(
                name: "items",
                schema: "pisa",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    stimulus = table.Column<string>(type: "jsonb", nullable: false),
                    search_text = table.Column<string>(type: "text", nullable: false),
                    direction = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    cognitive_process = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    context = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false),
                    expected_time_minutes = table.Column<int>(type: "integer", nullable: false),
                    grade_range_min = table.Column<int>(type: "integer", nullable: false),
                    grade_range_max = table.Column<int>(type: "integer", nullable: false),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "item_questions",
                schema: "pisa",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    payload = table.Column<string>(type: "jsonb", nullable: false),
                    answer_key = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_item_questions", x => x.id);
                    table.ForeignKey(
                        name: "fk_item_questions_items_item_id",
                        column: x => x.item_id,
                        principalSchema: "pisa",
                        principalTable: "items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_item_questions_item_id_position",
                schema: "pisa",
                table: "item_questions",
                columns: new[] { "item_id", "position" });

            migrationBuilder.CreateIndex(
                name: "ix_items_direction_level",
                schema: "pisa",
                table: "items",
                columns: new[] { "direction", "level" });

            migrationBuilder.CreateIndex(
                name: "ix_items_grade_range_min_grade_range_max",
                schema: "pisa",
                table: "items",
                columns: new[] { "grade_range_min", "grade_range_max" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "item_questions",
                schema: "pisa");

            migrationBuilder.DropTable(
                name: "items",
                schema: "pisa");
        }
    }
}
