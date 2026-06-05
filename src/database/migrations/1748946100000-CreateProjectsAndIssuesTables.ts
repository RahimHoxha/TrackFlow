import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectsAndIssuesTables1748946100000
  implements MigrationInterface
{
  name = 'CreateProjectsAndIssuesTables1748946100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text,
        "owner_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "issues_status_enum" AS ENUM ('open', 'in_progress', 'resolved')
    `);

    await queryRunner.query(`
      CREATE TABLE "issues" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying NOT NULL,
        "description" text,
        "status" "issues_status_enum" NOT NULL DEFAULT 'open',
        "project_id" uuid NOT NULL,
        "assignee_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issues_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issues_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_issues_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_issues_project_id" ON "issues" ("project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_issues_status" ON "issues" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_issues_assignee_id" ON "issues" ("assignee_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_issues_assignee_id"`);
    await queryRunner.query(`DROP INDEX "IDX_issues_status"`);
    await queryRunner.query(`DROP INDEX "IDX_issues_project_id"`);
    await queryRunner.query(`DROP TABLE "issues"`);
    await queryRunner.query(`DROP TYPE "issues_status_enum"`);
    await queryRunner.query(`DROP TABLE "projects"`);
  }
}
