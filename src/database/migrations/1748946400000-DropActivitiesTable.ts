import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropActivitiesTable1748946400000 implements MigrationInterface {
  name = 'DropActivitiesTable1748946400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activities_type_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "activities_type_enum" AS ENUM (
        'project_created',
        'project_updated',
        'project_deleted',
        'issue_created',
        'issue_updated',
        'issue_status_changed',
        'issue_assigned',
        'issue_unassigned',
        'issue_deleted',
        'comment_added'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "activities_type_enum" NOT NULL,
        "summary" character varying NOT NULL,
        "metadata" jsonb,
        "actor_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "issue_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities_id" PRIMARY KEY ("id")
      )
    `);
  }
}
