import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Typography } from '@material-ui/core';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import AddBoxIcon from '@material-ui/icons/AddBox';
import type { TableColumn } from '@backstage/core-components';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  Link,
  LinkButton,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils';
import { useApi } from '@backstage/core-plugin-api';
import type { DeliveryProject } from '@internal/plugin-adp-common';
import { deliveryProjectDisplayName } from '@internal/plugin-adp-common';
import { deliveryProjectApiRef } from './api/DeliveryProjectApi';
import { CreateDeliveryProjectButton } from './CreateDeliveryProjectButton';
import { EditDeliveryProjectButton } from './EditDeliveryProjectButton';
import {
  useAsyncDataSource,
  useEntityRoute,
  useErrorCallback,
} from '../../hooks';

type DeliveryProjectWithActions = DeliveryProject & {
  actions: ReactNode;
};

export const DeliveryProjectViewPageComponent = () => {
  const client = useApi(deliveryProjectApiRef);
  const entityRoute = useEntityRoute();
  const { data, refresh, loading } = useAsyncDataSource(
    useCallback(() => client.getDeliveryProjects(), [client]),
    useErrorCallback({
      name: 'Error while getting the list of delivery projects.',
    }),
  );
  const tableData = useMemo(
    () =>
      data?.map<DeliveryProjectWithActions>(d => {
        const target = entityRoute(d.name, 'group', 'default');
        return {
          ...d,
          titleLink: <Link to={target}>{deliveryProjectDisplayName(d)}</Link>,
          actions: (
            <>
              <LinkButton
                to={`${target}/manage-delivery-project-users`}
                variant="outlined"
                color="default"
                title="View Delivery Project team members"
              >
                <AccountBoxIcon />
              </LinkButton>
              &nbsp;
              <EditDeliveryProjectButton
                variant="contained"
                color="default"
                deliveryProject={d}
                data-testid={`delivery-project-edit-button-${d.id}`}
                onEdited={refresh}
              >
                Edit
              </EditDeliveryProjectButton>
            </>
          ),
        };
      }),
    [data, refresh, entityRoute],
  );

  const columns: TableColumn<DeliveryProjectWithActions>[] = [
    {
      title: 'Title',
      highlight: true,
      field: 'titleLink',
    },
    {
      title: 'Alias',
      field: 'alias',
      highlight: false,
      type: 'string',
    },

    {
      title: 'Delivery Programme',
      field: 'delivery_programme_name',
      highlight: false,
      type: 'string',
    },

    {
      title: 'Description',
      field: 'description',
      highlight: false,
      type: 'string',
    },

    {
      title: 'Updated At',
      field: 'updated_at',
      highlight: false,
      type: 'datetime',
    },

    {
      highlight: true,
      field: 'actions',
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Azure Development Platform: Onboarding"
        subtitle="ADP Platform Configuration"
      />
      <Content>
        <ContentHeader title="Delivery Projects">
          <CreateDeliveryProjectButton
            variant="contained"
            size="large"
            color="primary"
            data-testid="delivery-project-add-button"
            startIcon={<AddBoxIcon />}
            onCreated={refresh}
          >
            Add Delivery Project
          </CreateDeliveryProjectButton>
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Delivery Projects to the Azure Developer Platform.
        </Typography>

        <DefaultTable
          data={tableData ?? []}
          columns={columns}
          title="View all"
          isCompact
          isLoading={loading}
        />
      </Content>
    </Page>
  );
};
