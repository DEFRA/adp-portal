import type { Knex } from 'knex';
import { GithubTeamStore } from './GithubTeamStore';
import type { delivery_project_github_team } from './delivery_project_github_team';
import { delivery_project_github_teams_name } from './delivery_project_github_team';
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';
import { ArmsLengthBodyStore } from '../armsLengthBody';
import type {
  ArmsLengthBody,
  DeliveryProgramme,
  DeliveryProject,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { DeliveryProgrammeStore } from '../deliveryProgramme';
import { DeliveryProjectStore } from '../deliveryProject';
import { assertUUID } from '../utils';

describe('GithubTeamStore', () => {
  const databases = TestDatabases.create();
  async function setup(database: TestDatabaseId) {
    const knex = await databases.init(database);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });

    const sut = new GithubTeamStore(knex);

    return { sut, knex };
  }

  async function seedALB(knex: Knex, alb: Partial<ArmsLengthBody> = {}) {
    const result = await new ArmsLengthBodyStore(knex).add(
      {
        alias: randomUUID(),
        description: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        creator: randomUUID(),
        owner: randomUUID(),
        ...alb,
      },
      alb.creator ?? randomUUID(),
      alb.owner ?? randomUUID(),
    );
    if (!result.success)
      throw new Error(`Failed to seed ALB: ${JSON.stringify(result.errors)}`);
    return result.value;
  }
  async function seedProgramme(
    knex: Knex,
    albId: string,
    programme: Partial<Omit<DeliveryProgramme, 'arms_length_body_id'>> = {},
  ) {
    const result = await new DeliveryProgrammeStore(knex).add(
      {
        alias: randomUUID(),
        description: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        delivery_programme_code: randomUUID(),
        ...programme,
        arms_length_body_id: albId,
      },
      randomUUID(),
    );
    if (!result.success)
      throw new Error(
        `Failed to seed Delivery Programme ${JSON.stringify(result.errors)}`,
      );
    return result.value;
  }
  async function seedProject(
    knex: Knex,
    programmeId: string,
    project: Partial<Omit<DeliveryProject, 'delivery_programme_id'>> = {},
  ) {
    const result = await new DeliveryProjectStore(knex).add(
      {
        github_team_visibility: 'public',
        alias: randomUUID(),
        description: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        ado_project: randomUUID(),
        delivery_project_code: randomUUID(),
        finance_code: randomUUID(),
        namespace: randomUUID(),
        service_owner: randomUUID(),
        team_type: randomUUID(),
        ...project,
        delivery_programme_id: programmeId,
      },
      randomUUID(),
    );
    if (!result.success)
      throw new Error(
        `Failed to seed Delivery Project ${JSON.stringify(result.errors)}`,
      );
    return result.value;
  }
  async function seedGithubTeam(
    knex: Knex,
    projectId: string,
    type: string,
    team: Partial<
      Omit<delivery_project_github_team, 'delivery_project_id' | 'type'>
    > = {},
  ) {
    assertUUID(projectId);
    return (
      await knex
        .table<delivery_project_github_team>(delivery_project_github_teams_name)
        .insert(
          {
            github_team_id: Math.random(),
            team_name: randomUUID(),
            ...team,
            team_type: type,
            delivery_project_id: projectId,
          },
          '*',
        )
    )[0];
  }

  describe('#get', () => {
    it.each(databases.eachSupportedId())(
      'Should return nothing when there are no records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);

        // act
        const actual = await sut.get(project.id);

        // assert
        expect(actual).toMatchObject({});
      },
    );
    it.each(databases.eachSupportedId())(
      'Should return a single result when there is only 1 record',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);
        const admins = await seedGithubTeam(knex, project.id, 'admins');

        // act
        const actual = await sut.get(project.id);

        // assert
        expect(actual).toMatchObject({
          admins: {
            id: admins.github_team_id,
            name: admins.team_name,
          },
        });
      },
    );
    it.each(databases.eachSupportedId())(
      'Should return all the results when there are many records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);
        const admins = await seedGithubTeam(knex, project.id, 'admins');
        const contributors = await seedGithubTeam(
          knex,
          project.id,
          'contributors',
        );

        // act
        const actual = await sut.get(project.id);

        // assert
        expect(actual).toMatchObject({
          admins: {
            id: admins.github_team_id,
            name: admins.team_name,
          },
          contributors: {
            id: contributors.github_team_id,
            name: contributors.team_name,
          },
        });
      },
    );
  });
  describe('#set', () => {
    it.each(databases.eachSupportedId())(
      'Should do nothing when there are no records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);

        // act
        await sut.set(project.id, {});

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([]);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should add new records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);

        // act
        await sut.set(project.id, {
          admins: {
            id: 123,
            name: 'Admins!',
          },
        });

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([
          {
            delivery_project_id: project.id,
            github_team_id: 123,
            team_name: 'Admins!',
            team_type: 'admins',
          },
        ]);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should replace existing records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);
        const admins = await seedGithubTeam(knex, project.id, 'admins');

        // act
        await sut.set(project.id, {
          admins: {
            id: 123,
            name: 'Admins!',
          },
        });

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([
          {
            delivery_project_id: project.id,
            github_team_id: 123,
            team_name: 'Admins!',
            team_type: 'admins',
          },
        ]);
        expect(records[0].id).not.toBe(admins.id);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should remove excess records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);
        await seedGithubTeam(knex, project.id, 'admins');

        // act
        await sut.set(project.id, {});

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([]);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should not touch records for other projects',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project1 = await seedProject(knex, programme.id);
        const project2 = await seedProject(knex, programme.id);
        await seedGithubTeam(knex, project1.id, 'admins');
        const admins2 = await seedGithubTeam(knex, project2.id, 'admins');

        // act
        await sut.set(project1.id, {});

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([admins2]);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should add, replace and remove records all at once',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);
        const admins = await seedGithubTeam(knex, project.id, 'admins');
        await seedGithubTeam(knex, project.id, 'extra');

        // act
        await sut.set(project.id, {
          admins: {
            id: 123,
            name: 'Admins!',
          },
          contributors: {
            id: 456,
            name: 'Contributors!',
          },
        });

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([
          {
            delivery_project_id: project.id,
            github_team_id: 123,
            team_name: 'Admins!',
            team_type: 'admins',
          },
          {
            delivery_project_id: project.id,
            github_team_id: 456,
            team_name: 'Contributors!',
            team_type: 'contributors',
          },
        ]);
        expect(records[0].id).not.toBe(admins.id);
      },
    );
  });
  describe('#delete', () => {
    it.each(databases.eachSupportedId())(
      'Should do nothing when there are no records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);

        // act
        await sut.delete(project.id);

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([]);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should remove all records',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project = await seedProject(knex, programme.id);
        await seedGithubTeam(knex, project.id, 'admins');
        await seedGithubTeam(knex, project.id, 'contributors');

        // act
        await sut.delete(project.id);

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([]);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should not touch records for other projects',
      async dbId => {
        // arrange
        const { sut, knex } = await setup(dbId);
        const alb = await seedALB(knex);
        const programme = await seedProgramme(knex, alb.id);
        const project1 = await seedProject(knex, programme.id);
        const project2 = await seedProject(knex, programme.id);
        await seedGithubTeam(knex, project1.id, 'admins');
        const admins2 = await seedGithubTeam(knex, project2.id, 'admins');

        // act
        await sut.delete(project1.id);

        // assert
        const records = await knex
          .table<delivery_project_github_team>('delivery_project_github_teams')
          .select('*');
        expect(records).toMatchObject([admins2]);
      },
    );
  });
});
