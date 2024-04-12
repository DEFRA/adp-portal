import { DeliveryProject } from '@internal/plugin-adp-common';
import {
  createName,
  getCurrentUsername,
  checkForDuplicateTitle,
  checkForDuplicateProjectCode,
  checkForDuplicateProgrammeCode,
} from './index';
import express from 'express';

describe('createName', () => {
  it('replaces spaces with dashes and converts to lowercase', () => {
    const input = 'Example Name';
    const expected = 'example-name';
    expect(createName(input)).toBe(expected);
  });

  it('handles strings longer than 64 characters', () => {
    const longName = 'a'.repeat(70);
    const expected = 'a'.repeat(64);
    expect(createName(longName)).toBe(expected);
  });

  it('removes extra spaces within the name', () => {
    const input = 'Example   Name With  Spaces';
    const expected = 'example-name-with-spaces';
    expect(createName(input)).toBe(expected);
  });
});

describe('checkForDuplicateTitle', () => {
  const data = [
    {
      creator: 'Seed',
      owner: 'Seed',
      title: 'Environment Agency',
      alias: 'EA',
      description: '',
      url: '',
      name: 'environment-agency',
      id: '24fcc156-a86c-4905-980a-90b73b218881',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  it('returns false when there is no duplicate title', async () => {
    const title = 'Example Title';
    expect(await checkForDuplicateTitle(data, title)).toBeFalsy();
  });

  it('returns true when there is a duplicate title', async () => {
    const title = 'Environment Agency';
    expect(await checkForDuplicateTitle(data, title)).toBeTruthy();
  });
});

describe('checkForDuplicateCode', () => {

  const data: DeliveryProject[] = [
    {
      title: 'Test title',
      alias: 'Test alias',
      description: 'Test description',
      finance_code: 'Test finance_code',
      delivery_project_code: 'Test delivery_project_code',
      namespace: 'Test namespace',
      ado_project: 'Test ado_project',
      name: 'Test name',
      team_type: 'Test team_type',
      service_owner: 'Test service_owner',
      id: '1',
      delivery_programme_id: '1',
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: 'author',
    },
  ];

  it('returns false when there is no duplicate code', async () => {
    const code = 'Example code';
    expect(await checkForDuplicateProjectCode(data, code)).toBeFalsy();
  });

  it('returns true when there is a duplicate code', async () => {
    const code = 'Test delivery_project_code';
    expect(await checkForDuplicateProjectCode(data, code)).toBeTruthy();
  });
});

describe('checkForDuplicateProgrammeCode', () => {

  const data = [
    {
      name: 'Seed',
      title: 'Seed',
      alias: 'EA',
      description: '',
      finance_code: '1',
      arms_length_body_id: "111",
      delivery_programme_code: '1',
      programme_managers: [
        {
          id: '1',
          delivery_programme_id: '1',
          aad_entity_ref_id: 'testUserId1',
          email: 'name1@email.com',
          name: 'name1',
        },
        {
          id: '2',
          delivery_programme_id: '2',
          aad_entity_ref_id: 'testUserId2',
          email: 'name2@email.com',
          name: 'name2',
        },
      ],
      id: '24fcc156-a86c-4905-980a-90b73b218881',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];


  it('returns false when there is no duplicate code', async () => {
    const code = 'Example Code';
    expect(await checkForDuplicateProgrammeCode(data, code)).toBeFalsy();
  });

  it('returns true when there is a duplicate code', async () => {
    const code = '1';
    expect(await checkForDuplicateProgrammeCode(data, code)).toBeTruthy();
  });
});

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

