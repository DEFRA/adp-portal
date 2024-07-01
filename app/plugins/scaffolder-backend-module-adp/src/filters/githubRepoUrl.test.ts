import { ConfigReader } from '@backstage/config';
import { createGithubRepoUrlFilter } from './githubRepoUrl';

describe('githubRepoUrl', () => {
  it('Should create the url correctly', () => {
    // arrange
    const config = new ConfigReader({
      github: {
        organization: 'test',
      },
    });
    const sut = createGithubRepoUrlFilter(config);

    // act
    const actual = sut('my-repo');

    // assert
    expect(actual).toBe('https://github.com/?owner=test&repo=my-repo');
  });
});
