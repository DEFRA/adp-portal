import {
  createName,
  createTransformerTitle,
  getCurrentUsername,
  checkForDuplicateTitle,
  getProgrammeManagerDetails,
} from './utils';
import express from 'express';
import { NotFoundError } from '@backstage/errors';
import { exampleCatalog } from './deliveryProgramme/programmeTestData';

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

describe('createTransformerTitle', () => {
  it('returns the title as is if no alias is provided', () => {
    const title = 'Example Title';
    expect(createTransformerTitle(title)).toBe(title);
  });

  it('puts the alias in brackets if provided', () => {
    const title = 'Example Title';
    const shortName = 'ET';
    const expected = 'Example Title (ET)';
    expect(createTransformerTitle(title, shortName)).toBe(expected);
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

describe('getProgrammeManagerDetails', () => {
  it('returns the programme manager details', async () => {
    await expect(
      getProgrammeManagerDetails(
        'a9dc2414-0626-43d2-993d-a53aac4d73421',
        exampleCatalog,
      ),
    ).resolves.toEqual({ email: 'test1.test@onmicrosoft.com', name: 'Test1 Test' });
  });

  it('returns error if name is not found', async () => {
    expect(
      getProgrammeManagerDetails(
        'a9dc2414-0626-43d2-993d-a53aac4d7341',
        exampleCatalog,
      ),
    ).rejects.toThrow(NotFoundError);
  });
});
