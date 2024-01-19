import { getAllArmsLengthBodies } from './armsLengthBody';

describe('ArmsLengthBody Filtering', () => {

  test('getAllArmsLengthBodies with "allOf" filter', () => {
    const results = getAllArmsLengthBodies({
      allOf: [
        { property: 'name', values: ['Environment Agency'] },
        { property: 'short_name', values: ['EA'] },
      ],
    });
    results.forEach(item => {
      expect(item.name).toBe('Environment Agency');
      expect(item.short_name).toBe('EA');
    });
  });

  test('getAllArmsLengthBodies with "anyOf" filter', () => {
    const results = getAllArmsLengthBodies({
      anyOf: [
        { property: 'name', values: ['Environment Agency'] },
        { property: 'short_name', values: ['EA'] },
      ],
    });
    results.forEach(item => {
      expect(item.name === 'Environment Agency' || item.short_name === 'EA').toBeTruthy();
    });
  });

  test('getAllArmsLengthBodies with "not" filter', () => {
    const results = getAllArmsLengthBodies({
      not: { property: 'owner_username', values: ['ADP'] },
    });
    results.forEach(item => {
      expect(item.owner_username).not.toBe('ADP');
    });
  });

});
