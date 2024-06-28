import type { DeliveryProject } from '@internal/plugin-adp-common';
import { getCurrentUsername, createGithubTeamDetails } from './index';
import express from 'express';

describe('getCurrentUsername', () => {
  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
    }),
  };

  it('returns the username when identity is found', async () => {
    mockIdentityApi.getIdentity.mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
    });

    await expect(
      getCurrentUsername(mockIdentityApi, express.request),
    ).resolves.toBe('user:default/johndoe');
  });

  it('returns "unknown" when identity is not found', async () => {
    mockIdentityApi.getIdentity.mockResolvedValue(null);

    await expect(
      getCurrentUsername(mockIdentityApi, express.request),
    ).resolves.toBe('unknown');
  });
});

describe('createGithubTeamNames', () => {
  it.each<{
    project: Partial<DeliveryProject>;
    expected: ReturnType<typeof createGithubTeamDetails>;
  }>([
    {
      project: { name: 'MyProject', description: 'My cool project' },
      expected: {
        contributors: {
          name: 'MyProject-Contributors',
          description: 'My cool project',
        },
        admins: {
          name: 'MyProject-Admins',
          description: 'My cool project',
        },
      },
    },
  ])(
    'Should correctly get the team names for a project with name $project.name',
    ({ project, expected }) => {
      // arrange
      const fullProject: DeliveryProject = {
        ado_project: '',
        alias: '',
        created_at: new Date(),
        delivery_programme_id: '',
        delivery_project_code: '',
        delivery_programme_code: '',
        delivery_project_users: [],
        delivery_programme_admins: [],
        description: '',
        finance_code: '',
        github_team_visibility: 'public',
        id: '',
        name: '',
        namespace: '',
        service_owner: '',
        team_type: '',
        title: '',
        updated_at: new Date(),
        updated_by: '',
        ...project,
      };

      // act
      const actual = createGithubTeamDetails(fullProject);

      // assert
      expect(actual).toMatchObject(expected);
    },
  );
});
