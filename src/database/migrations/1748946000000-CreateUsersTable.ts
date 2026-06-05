import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1748946000000 implements MigrationInterface {
  name = 'CreateUsersTable1748946000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
