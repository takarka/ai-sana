using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CraftAi.Modules.Organizations.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "organizations");

            migrationBuilder.CreateTable(
                name: "organizations",
                schema: "organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    region = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organizations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "academic_years",
                schema: "organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    starts_on = table.Column<DateOnly>(type: "date", nullable: false),
                    ends_on = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_academic_years", x => x.id);
                    table.ForeignKey(
                        name: "fk_academic_years_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "organizations",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_import_batches",
                schema: "organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    preview_json = table.Column<string>(type: "jsonb", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_import_batches", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_import_batches_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "organizations",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "class_groups",
                schema: "organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    academic_year_id = table.Column<Guid>(type: "uuid", nullable: false),
                    grade = table.Column<int>(type: "integer", nullable: false),
                    letter = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_class_groups", x => x.id);
                    table.ForeignKey(
                        name: "fk_class_groups_academic_years_academic_year_id",
                        column: x => x.academic_year_id,
                        principalSchema: "organizations",
                        principalTable: "academic_years",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_class_groups_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "organizations",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "organization_members",
                schema: "organizations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    class_group_id = table.Column<Guid>(type: "uuid", nullable: true),
                    external_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organization_members", x => x.id);
                    table.ForeignKey(
                        name: "fk_organization_members_class_groups_class_group_id",
                        column: x => x.class_group_id,
                        principalSchema: "organizations",
                        principalTable: "class_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_organization_members_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "organizations",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_academic_years_organization_id",
                schema: "organizations",
                table: "academic_years",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "ix_class_groups_academic_year_id",
                schema: "organizations",
                table: "class_groups",
                column: "academic_year_id");

            migrationBuilder.CreateIndex(
                name: "ix_class_groups_organization_id_academic_year_id_grade_letter",
                schema: "organizations",
                table: "class_groups",
                columns: new[] { "organization_id", "academic_year_id", "grade", "letter" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_class_group_id",
                schema: "organizations",
                table: "organization_members",
                column: "class_group_id");

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_organization_id_external_id",
                schema: "organizations",
                table: "organization_members",
                columns: new[] { "organization_id", "external_id" },
                unique: true,
                filter: "external_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_organization_id_role",
                schema: "organizations",
                table: "organization_members",
                columns: new[] { "organization_id", "role" });

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_user_id",
                schema: "organizations",
                table: "organization_members",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_organizations_name",
                schema: "organizations",
                table: "organizations",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_user_import_batches_organization_id",
                schema: "organizations",
                table: "user_import_batches",
                column: "organization_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organization_members",
                schema: "organizations");

            migrationBuilder.DropTable(
                name: "user_import_batches",
                schema: "organizations");

            migrationBuilder.DropTable(
                name: "class_groups",
                schema: "organizations");

            migrationBuilder.DropTable(
                name: "academic_years",
                schema: "organizations");

            migrationBuilder.DropTable(
                name: "organizations",
                schema: "organizations");
        }
    }
}
