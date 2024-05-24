import { toDotnetProjectName } from './toDotnetProjectName';

describe('toDotnetProjectName', () => {
  it('Should return dotnet project name', () => {
    const input = 'adp-template-dotnet';
    const expected = 'Adp.Template.Dotnet';
    expect(toDotnetProjectName(input)).toBe(expected);
  });
});
