import express, { Router } from 'express';
import { testHelpers } from '../../utils/testHelpers';
import index from './index';
import request from 'supertest';
import armsLengthBodies from './arms-length-bodies';
import deliveryProgrammes from './delivery-programmes';
import deliveryProjects from './delivery-projects';

describe('default', () => {
  async function setup() {
    const albs = Router();
    const programmes = Router();
    const projects = Router();

    const handler = await testHelpers.getAutoServiceRef(index, [
      testHelpers.provideService(armsLengthBodies, albs),
      testHelpers.provideService(deliveryProgrammes, programmes),
      testHelpers.provideService(deliveryProjects, projects),
    ]);

    const app = express();
    app.use(handler);

    return {
      handler,
      app,
      albs,
      programmes,
      projects,
    };
  }
  describe('GET /arms-length-bodies', () => {
    it('Should call armsLengthBodies', async () => {
      const { app, albs } = await setup();
      albs.get('/', (_, res) => res.status(200).json({ result: 'Success!' }));

      const { status, body } = await request(app).get('/arms-length-bodies');

      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });

  describe('GET /delivery-programmes', () => {
    it('Should call deliveryProgrammes', async () => {
      const { app, programmes } = await setup();
      programmes.get('/', (_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/delivery-programmes');

      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });
  describe('GET /delivery-projects', () => {
    it('Should call deliveryProjects', async () => {
      const { app, projects } = await setup();
      projects.get('/', (_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/delivery-projects');

      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });
});
