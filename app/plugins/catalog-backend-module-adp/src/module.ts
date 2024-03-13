import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';

export const catalogModuleAdp = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp',
  register(reg) {
    reg.registerInit({
      deps: { logger: coreServices.logger },
      async init({ logger }) {
        logger.warn('Hello World from ADP catalog module!')
      },
    });
  },
});
