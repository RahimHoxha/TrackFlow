import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentsTable1748946300000 implements MigrationInterface {
  name = 'CreateCommentsTable1748946300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "content" text NOT NULL,
        "issue_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comments_issue" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comments_issue_id" ON "comments" ("issue_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_comments_issue_id"`);
    await queryRunner.query(`DROP TABLE "comments"`);
  }
}
