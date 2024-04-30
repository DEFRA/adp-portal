import {
  ArmsLengthBody,
  DeliveryProgramme,
  DeliveryProject,
} from '@internal/plugin-adp-common';
import { IdentityApi } from '@backstage/plugin-auth-node';
import express from 'express';
import { AlbRouterOptions } from '../service/armsLengthBodyRouter';
import * as urlSlug from 'url-slug'

export function createName(name: string) {
  const nameConversion = urlSlug.convert(name.toLowerCase(), {
    separator: '-',
    transformer: (fragments, separator) =>
      fragments
        .map(
          (fragment) =>
            fragment.replace(/[^a-zA-Z0-9._-]/g, '')
        )
        .join(separator),
  })
  const nameValue = nameConversion.substring(0, 64);
  return nameValue;
}

export async function checkForDuplicateTitle(
  store: DeliveryProgramme[] | ArmsLengthBody[] | DeliveryProject[],
  title: string,
): Promise<boolean> {
  title = title.trim().toLowerCase();
  const duplicate = store.find(
    object => object.title.trim().toLowerCase() === title,
  );

  return duplicate !== undefined;
}

export async function checkForDuplicateProjectCode(
  store: DeliveryProject[],
  code: string,
): Promise<boolean> {
  code = code.trim().toLowerCase();
  const duplicate = store.find(
    object => object.delivery_project_code.trim().toLowerCase() === code,
  );

  return duplicate !== undefined;
}

export async function checkForDuplicateProgrammeCode(
  store: DeliveryProgramme[],
  delivery_programme_code: string,
): Promise<boolean> {
  delivery_programme_code = delivery_programme_code.trim().toLowerCase();
  const duplicate = store.find(
    object =>
      object.delivery_programme_code.trim().toLowerCase() ===
      delivery_programme_code,
  );

  return duplicate !== undefined;
}

export async function getCurrentUsername(
  identity: IdentityApi,
  req: express.Request,
): Promise<string> {
  const user = await identity.getIdentity({ request: req });
  return user?.identity.userEntityRef ?? 'unknown';
}

export function getOwner(options: AlbRouterOptions): string {
  const { config } = options;
  const ownerGroup = config.getConfig('rbac');
  const owner = ownerGroup.getString('programmeAdminGroup');
  return owner;
}

export type { CreateDeliveryProgrammeAdmin } from './types';

export function createGithubTeamDetails(deliveryProject: DeliveryProject) {
  return {
    contributors: {
      name: `${deliveryProject.name}-Contributors`,
      description: deliveryProject.description,
    },
    admins: {
      name: `${deliveryProject.name}-Admins`,
      description: deliveryProject.description,
    },
  };
}
