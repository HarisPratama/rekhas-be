import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedRoles1745055915411 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          INSERT INTO role (id, name) VALUES
          (1, 'DIRECTOR'),
          (2, 'OFFICE'),
          (3, 'SALES'),
          (4, 'TAILOR'),
          (5, 'CUTTER'),
          (6, 'COURIER')
          ON CONFLICT (id) DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          DELETE FROM role WHERE id IN (1, 2, 3, 4, 5, 6);
        `);
    }

}
