import {
  DEFAULT_NAMESPACE,
  type GroupEntity,
  type UserEntity,
} from '@backstage/catalog-model';
import { DeliveryProjectProcessor } from './DeliveryProjectProcessor';
import {
  processingResult,
  type CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import {
  DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION,
  DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION,
  DELIVERY_PROJECT_USER_IS_ADMIN_MEMBER,
  DELIVERY_PROJECT_USER_IS_TECH_MEMBER,
  USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
  USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
} from '@internal/plugin-adp-common';

describe('DeliveryProjectProcessor', () => {
  describe('#getProcessorName', () => {
    it('Should return the processors name', () => {
      const { sut } = setup();

      expect(sut.getProcessorName()).toBe(DeliveryProjectProcessor.name);
    });
  });

  describe('#postProcessEntity', () => {
    it('Should do nothing for non group entities', async () => {
      const { sut, emitter } = setup();
      const user: UserEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'User',
        metadata: {
          name: 'test-user',
        },
        spec: {},
      };

      const actual = await sut.postProcessEntity(user, null, emitter);

      expect(actual).toBe(user);
      expect(emitter).not.toHaveBeenCalled();
    });
    it('Should do nothing for non delivery project groups', async () => {
      const { sut, emitter } = setup();
      const group: GroupEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: 'test-group',
        },
        spec: {
          type: 'something-else',
          children: [],
        },
      };

      const actual = await sut.postProcessEntity(group, null, emitter);

      expect(actual).toBe(group);
      expect(emitter).not.toHaveBeenCalled();
    });
    it('Should do nothing for delivery projects with no members', async () => {
      const { sut, emitter } = setup();
      const group: GroupEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: 'test-project',
        },
        spec: {
          type: 'delivery-project',
          children: [],
        },
      };

      const actual = await sut.postProcessEntity(group, null, emitter);

      expect(actual).toBe(group);
      expect(emitter).not.toHaveBeenCalled();
    });
    it('Should emit relations for all members with a role', async () => {
      const { sut, emitter } = setup();
      const group: GroupEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: 'test-project',
          namespace: 'abc',
          annotations: {
            [DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION]:
              '["admin-user","admin-tech-user"]',
            [DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION]:
              '["tech-user","admin-tech-user"]',
          },
        },
        spec: {
          type: 'delivery-project',
          children: [],
          members: ['basic-user', 'admin-user', 'tech-user', 'admin-tech-user'],
        },
      };
      const projectRef = {
        name: 'test-project',
        kind: 'Group',
        namespace: 'abc',
      };
      const userRef = (user: string) => ({
        name: user,
        kind: 'user',
        namespace: DEFAULT_NAMESPACE,
      });

      const actual = await sut.postProcessEntity(group, null, emitter);

      expect(actual).toBe(group);
      expect(emitter).toHaveBeenCalledTimes(8);
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: projectRef,
          target: userRef('admin-user'),
          type: DELIVERY_PROJECT_USER_IS_ADMIN_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: userRef('admin-user'),
          target: projectRef,
          type: USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: projectRef,
          target: userRef('admin-tech-user'),
          type: DELIVERY_PROJECT_USER_IS_ADMIN_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: userRef('admin-tech-user'),
          target: projectRef,
          type: USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: projectRef,
          target: userRef('tech-user'),
          type: DELIVERY_PROJECT_USER_IS_TECH_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: userRef('tech-user'),
          target: projectRef,
          type: USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: projectRef,
          target: userRef('admin-tech-user'),
          type: DELIVERY_PROJECT_USER_IS_TECH_MEMBER,
        }),
      );
      expect(emitter).toHaveBeenCalledWith(
        processingResult.relation({
          source: userRef('admin-tech-user'),
          target: projectRef,
          type: USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
        }),
      );
    });
  });
});

function setup() {
  const sut = new DeliveryProjectProcessor();
  const emitter: jest.MockedFn<CatalogProcessorEmit> = jest.fn();

  return { sut, emitter };
}
