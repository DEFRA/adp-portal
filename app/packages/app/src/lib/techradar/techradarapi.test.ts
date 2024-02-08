import { techRadarApiRef } from './techradarapi';

describe('techradarapi', () => {
  it('should create an API ref', () => {
    const apiRef = techRadarApiRef;
    expect(apiRef.id).toEqual('plugin.techradar.service');
  });
});
