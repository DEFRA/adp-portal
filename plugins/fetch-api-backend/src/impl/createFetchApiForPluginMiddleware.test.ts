import type { PluginMetadataService } from '@backstage/backend-plugin-api';
import type { Fetch, FetchApiMiddleware } from '../types';
import { randomUUID } from 'node:crypto';
import { createFetchApiForPluginMiddleware } from './createFetchApiForPluginMiddleware';

describe('createFetchApiForPluginMiddleware', () => {
  it('Should call the middleware when the plugin id matches and is a string', () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();
    const mwFetch: jest.MockedFn<Fetch> = jest.fn();
    const targetPluginId = randomUUID();
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const metadata: jest.Mocked<PluginMetadataService> = {
      getId: jest.fn(),
    };

    middleware.mockReturnValueOnce(mwFetch);
    metadata.getId.mockReturnValueOnce(targetPluginId);

    // act
    const sut = createFetchApiForPluginMiddleware({
      pluginId: targetPluginId,
      middleware,
      pluginMetadata: metadata,
    });
    const actual = sut(fetch);

    // assert
    expect(actual).toBe(mwFetch);
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledWith(fetch);
    expect(metadata.getId).toHaveBeenCalledTimes(1);
  });
  it('Should not call the middleware when the plugin id does not match and is a string', () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();
    const targetPluginId = randomUUID();
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const metadata: jest.Mocked<PluginMetadataService> = {
      getId: jest.fn(),
    };

    metadata.getId.mockReturnValueOnce(randomUUID());

    // act
    const sut = createFetchApiForPluginMiddleware({
      pluginId: targetPluginId,
      middleware,
      pluginMetadata: metadata,
    });
    const actual = sut(fetch);

    // assert
    expect(actual).toBe(fetch);
    expect(middleware).toHaveBeenCalledTimes(0);
    expect(metadata.getId).toHaveBeenCalledTimes(1);
  });
  it('Should call the middleware when the plugin id matches and is a string array', () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();
    const mwFetch: jest.MockedFn<Fetch> = jest.fn();
    const targetPluginId = randomUUID();
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const metadata: jest.Mocked<PluginMetadataService> = {
      getId: jest.fn(),
    };

    middleware.mockReturnValueOnce(mwFetch);
    metadata.getId.mockReturnValueOnce(targetPluginId);

    // act
    const sut = createFetchApiForPluginMiddleware({
      pluginId: [randomUUID(), targetPluginId, randomUUID()],
      middleware,
      pluginMetadata: metadata,
    });
    const actual = sut(fetch);

    // assert
    expect(actual).toBe(mwFetch);
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledWith(fetch);
    expect(metadata.getId).toHaveBeenCalledTimes(1);
  });
  it('Should not call the middleware when the plugin id does not match and is a string array', () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();
    const targetPluginId = randomUUID();
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const metadata: jest.Mocked<PluginMetadataService> = {
      getId: jest.fn(),
    };

    metadata.getId.mockReturnValueOnce(randomUUID());

    // act
    const sut = createFetchApiForPluginMiddleware({
      pluginId: [randomUUID(), targetPluginId, randomUUID()],
      middleware,
      pluginMetadata: metadata,
    });
    const actual = sut(fetch);

    // assert
    expect(actual).toBe(fetch);
    expect(middleware).toHaveBeenCalledTimes(0);
    expect(metadata.getId).toHaveBeenCalledTimes(1);
  });
});
