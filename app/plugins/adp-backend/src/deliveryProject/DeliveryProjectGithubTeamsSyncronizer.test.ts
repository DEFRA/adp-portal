import {
  DeliveryProgramme,
  DeliveryProject,
} from '@internal/plugin-adp-common';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';
import { DeliveryProjectGithubTeamsSyncronizer } from './DeliveryProjectGithubTeamsSyncronizer';
import { GithubTeamDetails, IGitHubTeamsApi } from './GitHubTeamsApi';
import { IDeliveryProjectStore } from './deliveryProjectStore';
import { randomUUID } from 'node:crypto';

describe('DeliveryProjectGithubTeamsSyncronizer', () => {
  function setup() {
    const githubTeams: jest.Mocked<IGitHubTeamsApi> = {
      setTeam: jest.fn(),
    };
    const deliveryProjects: jest.Mocked<IDeliveryProjectStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getByName: jest.fn(),
      update: jest.fn(),
    };
    const deliveryProgrammes: jest.Mocked<IDeliveryProgrammeStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
    };

    const sut = new DeliveryProjectGithubTeamsSyncronizer(
      githubTeams,
      deliveryProjects,
      deliveryProgrammes,
    );

    return { sut, githubTeams, deliveryProjects, deliveryProgrammes };
  }

  describe('#syncronize', () => {
    it('Should fail to syncronize an unknown project', async () => {
      // arrange
      const { sut, deliveryProjects, deliveryProgrammes, githubTeams } =
        setup();
      const projectName = randomUUID();

      deliveryProjects.getByName.mockResolvedValueOnce(null);

      // act
      await expectException(() => sut.syncronize(projectName));

      // assert
      expect(deliveryProjects.getByName.mock.calls).toMatchObject([
        [projectName],
      ]);
      expect(deliveryProgrammes.get.mock.calls).toMatchObject([]);
      expect(githubTeams.setTeam.mock.calls).toMatchObject([]);
    });
    it('Should fail to syncronize a project with an unknown programme', async () => {
      // arrange
      const { sut, deliveryProjects, deliveryProgrammes, githubTeams } =
        setup();
      const projectName = randomUUID();
      const programmeId = randomUUID();
      const project: DeliveryProject = {
        ado_project: randomUUID(),
        created_at: new Date(),
        delivery_programme_id: programmeId,
        id: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        description: randomUUID(),
        team_type: randomUUID(),
        service_owner: randomUUID(),
        delivery_project_code: randomUUID(),
        namespace: randomUUID(),
        updated_at: new Date(),
        github_team_visibility: 'private',
      };

      deliveryProjects.getByName.mockResolvedValueOnce(project);
      deliveryProgrammes.get.mockResolvedValueOnce(null);

      // act
      await expectException(() => sut.syncronize(projectName));

      // assert
      expect(deliveryProjects.getByName.mock.calls).toMatchObject([
        [projectName],
      ]);
      expect(deliveryProgrammes.get.mock.calls).toMatchObject([[programmeId]]);
      expect(githubTeams.setTeam.mock.calls).toMatchObject([]);
    });
    it('Should syncronize a valid project', async () => {
      // arrange
      const { sut, deliveryProjects, deliveryProgrammes, githubTeams } =
        setup();
      const projectName = 'my-project';
      const programmeName = 'my-programme';
      const description = randomUUID();
      const programmeId = randomUUID();
      const project: DeliveryProject = {
        ado_project: randomUUID(),
        created_at: new Date(),
        delivery_programme_id: programmeId,
        id: randomUUID(),
        name: projectName,
        title: randomUUID(),
        description,
        team_type: randomUUID(),
        service_owner: randomUUID(),
        delivery_project_code: randomUUID(),
        namespace: randomUUID(),
        updated_at: new Date(),
        github_team_visibility: 'private',
      };
      const programme: DeliveryProgramme = {
        id: randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
        programme_managers: [],
        title: randomUUID(),
        name: programmeName,
        description: randomUUID(),
        arms_length_body_id: randomUUID(),
        delivery_programme_code: randomUUID(),
      };
      const contributors: GithubTeamDetails = {
        description: randomUUID(),
        id: 123,
        isPublic: true,
        maintainers: [randomUUID()],
        members: [randomUUID()],
        name: randomUUID(),
        slug: randomUUID(),
      };
      const admins: GithubTeamDetails = {
        description: randomUUID(),
        id: 456,
        isPublic: true,
        maintainers: [randomUUID()],
        members: [randomUUID()],
        name: randomUUID(),
        slug: randomUUID(),
      };

      deliveryProjects.getByName.mockResolvedValueOnce(project);
      deliveryProgrammes.get.mockResolvedValueOnce(programme);
      githubTeams.setTeam
        .mockResolvedValueOnce(contributors)
        .mockResolvedValueOnce(admins);

      // act
      const actual = await sut.syncronize(projectName);

      // assert
      expect(actual).toMatchObject({
        contributors,
        admins,
      });
      expect(deliveryProjects.getByName.mock.calls).toMatchObject([
        [projectName],
      ]);
      expect(deliveryProgrammes.get.mock.calls).toMatchObject([[programmeId]]);
      expect(githubTeams.setTeam.mock.calls).toMatchObject([
        [
          'ADP-my-programme-my-project-Contributors',
          { description, isPublic: false },
        ],
        [
          'ADP-my-programme-my-project-Admins',
          { description, isPublic: false },
        ],
      ]);
    });
  });
});

async function expectException(action: () => unknown) {
  try {
    await action();
    throw new Error('No exception was thrown where one was expected');
  } catch (err) {
    return err;
  }
}
