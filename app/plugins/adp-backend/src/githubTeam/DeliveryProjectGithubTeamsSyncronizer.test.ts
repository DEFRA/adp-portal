import type {
  DeliveryProject,
  GithubTeamDetails,
} from '@internal/plugin-adp-common';
import { DeliveryProjectGithubTeamsSyncronizer } from './DeliveryProjectGithubTeamsSyncronizer';
import type { IGitHubTeamsApi } from './GithubTeamsApi';
import type { IDeliveryProjectStore } from '../deliveryProject/deliveryProjectStore';
import { randomUUID } from 'node:crypto';
import type { GithubTeamRef, IGithubTeamStore } from './GithubTeamStore';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import { createDeliveryProjectUser } from '../testData/projectUserTestData';

describe('DeliveryProjectGithubTeamsSyncronizer', () => {
  function setup() {
    const githubTeamsApi: jest.Mocked<IGitHubTeamsApi> = {
      setTeam: jest.fn(),
      createTeam: jest.fn(),
    };
    const deliveryProjects: jest.Mocked<IDeliveryProjectStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getByName: jest.fn(),
      update: jest.fn(),
    };
    const githubTeamsStore: jest.Mocked<IGithubTeamStore> = {
      delete: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };
    const deliveryProjectUserStore: jest.Mocked<IDeliveryProjectUserStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      getByDeliveryProject: jest.fn(),
      update: jest.fn(),
    };

    const sut = new DeliveryProjectGithubTeamsSyncronizer(
      githubTeamsApi,
      deliveryProjects,
      githubTeamsStore,
      deliveryProjectUserStore,
    );

    return {
      sut,
      githubTeamsApi,
      deliveryProjects,
      githubTeamsStore,
      deliveryProjectUserStore,
    };
  }

  describe('#syncronizeByName', () => {
    it('Should fail to syncronize an unknown project', async () => {
      // arrange
      const { sut, deliveryProjects, githubTeamsStore, githubTeamsApi } =
        setup();
      const projectName = randomUUID();

      deliveryProjects.getByName.mockRejectedValueOnce(new Error());

      // act
      await expectException(() => sut.syncronizeByName(projectName));

      // assert
      expect(deliveryProjects.getByName.mock.calls).toMatchObject([
        [projectName],
      ]);
      expect(githubTeamsApi.setTeam.mock.calls).toMatchObject([]);
      expect(githubTeamsStore.get.mock.calls).toMatchObject([]);
      expect(githubTeamsStore.set.mock.calls).toMatchObject([]);
    });
    it('Should syncronize a valid project', async () => {
      // arrange
      const {
        sut,
        deliveryProjects,
        githubTeamsStore,
        githubTeamsApi,
        deliveryProjectUserStore,
      } = setup();
      const projectName = 'my-project';
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
        delivery_programme_code: 'ABC',
        delivery_project_users: [],
        delivery_programme_admins: [],
      };
      const storedTeams: Record<string, GithubTeamRef> = {
        admins: {
          id: 456,
          name: 'Admins',
        },
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
        id: 789,
        isPublic: true,
        maintainers: [randomUUID()],
        members: [randomUUID()],
        name: randomUUID(),
        slug: randomUUID(),
      };
      const projectUsers = [
        {
          ...createDeliveryProjectUser(project.id),
          is_admin: true,
          is_technical: true,
        },
        {
          ...createDeliveryProjectUser(project.id),
          is_admin: false,
          is_technical: true,
        },
      ];

      deliveryProjects.getByName.mockResolvedValueOnce(project);
      githubTeamsStore.get.mockResolvedValueOnce(storedTeams);
      githubTeamsApi.setTeam.mockResolvedValueOnce(admins);
      githubTeamsApi.createTeam.mockResolvedValueOnce(contributors);
      deliveryProjectUserStore.getByDeliveryProject.mockResolvedValue(
        projectUsers,
      );

      // act
      const actual = await sut.syncronizeByName(projectName);

      // assert
      expect(actual).toMatchObject({
        contributors,
        admins,
      });
      expect(deliveryProjects.getByName.mock.calls).toMatchObject([
        [projectName],
      ]);
      expect(githubTeamsStore.get.mock.calls).toMatchObject([[project.id]]);
      expect(githubTeamsStore.set.mock.calls).toMatchObject([
        [
          project.id,
          {
            admins: {
              id: 789,
              name: admins.name,
            },
            contributors: {
              id: 123,
              name: contributors.name,
            },
          },
        ],
      ]);
      expect(githubTeamsApi.setTeam.mock.calls).toMatchObject([
        [456, { name: 'my-project-Admins', description, isPublic: false }],
      ]);
      expect(githubTeamsApi.createTeam.mock.calls).toMatchObject([
        [{ name: 'my-project-Contributors', description, isPublic: false }],
      ]);
    });
  });

  describe('#syncronizeById', () => {
    it('Should fail to syncronize an unknown project', async () => {
      // arrange
      const { sut, deliveryProjects, githubTeamsStore, githubTeamsApi } =
        setup();
      const projectid = randomUUID();

      deliveryProjects.getByName.mockRejectedValueOnce(new Error());

      // act
      await expectException(() => sut.syncronizeById(projectid));

      // assert
      expect(deliveryProjects.get.mock.calls).toMatchObject([[projectid]]);
      expect(githubTeamsApi.setTeam.mock.calls).toMatchObject([]);
      expect(githubTeamsStore.get.mock.calls).toMatchObject([]);
      expect(githubTeamsStore.set.mock.calls).toMatchObject([]);
    });

    it('Should syncronize a valid project', async () => {
      // arrange
      const {
        sut,
        deliveryProjects,
        githubTeamsStore,
        githubTeamsApi,
        deliveryProjectUserStore,
      } = setup();
      const projectName = 'my-project';
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
        delivery_programme_code: 'ABC',
        delivery_project_users: [],
        delivery_programme_admins: [],
      };
      const storedTeams: Record<string, GithubTeamRef> = {
        admins: {
          id: 456,
          name: 'Admins',
        },
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
        id: 789,
        isPublic: true,
        maintainers: [randomUUID()],
        members: [randomUUID()],
        name: randomUUID(),
        slug: randomUUID(),
      };
      const projectUsers = [
        {
          ...createDeliveryProjectUser(project.id),
          is_admin: true,
          is_technical: true,
        },
        {
          ...createDeliveryProjectUser(project.id),
          is_admin: false,
          is_technical: true,
        },
      ];

      deliveryProjects.get.mockResolvedValueOnce(project);
      githubTeamsStore.get.mockResolvedValueOnce(storedTeams);
      githubTeamsApi.setTeam.mockResolvedValueOnce(admins);
      githubTeamsApi.createTeam.mockResolvedValueOnce(contributors);
      deliveryProjectUserStore.getByDeliveryProject.mockResolvedValue(
        projectUsers,
      );

      // act
      const actual = await sut.syncronizeById(project.id);

      // assert
      expect(actual).toMatchObject({
        contributors,
        admins,
      });
      expect(deliveryProjects.get.mock.calls).toMatchObject([[project.id]]);
      expect(githubTeamsStore.get.mock.calls).toMatchObject([[project.id]]);
      expect(githubTeamsStore.set.mock.calls).toMatchObject([
        [
          project.id,
          {
            admins: {
              id: 789,
              name: admins.name,
            },
            contributors: {
              id: 123,
              name: contributors.name,
            },
          },
        ],
      ]);
      expect(githubTeamsApi.setTeam.mock.calls).toMatchObject([
        [456, { name: 'my-project-Admins', description, isPublic: false }],
      ]);
      expect(githubTeamsApi.createTeam.mock.calls).toMatchObject([
        [{ name: 'my-project-Contributors', description, isPublic: false }],
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
