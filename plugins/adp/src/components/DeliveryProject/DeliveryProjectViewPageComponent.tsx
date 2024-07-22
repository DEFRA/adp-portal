import React, { useCallback } from 'react';
import { Typography } from '@material-ui/core';
import AccountBoxIcon from '@mui/icons-material/ManageAccounts';
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

export const DeliveryProjectViewPageComponent = () => {
  const client = useApi(deliveryProjectApiRef);
  const entityRoute = useEntityRoute();
  const { data, refresh, loading } = useAsyncDataSource(
    useCallback(() => client.getDeliveryProjects(), [client]),
    useErrorCallback({
      name: 'Error while getting the list of delivery projects.',
    }),
  );

  const columns: TableColumn<DeliveryProject>[] = [
    {
      title: 'Name',
      field: 'title',
      defaultSort: 'asc',
      highlight: true,
      render(d) {
        return (
          <Link
            to={entityRoute(d.name, 'group')}
            title={`View ${d.title} in the catalog`}
          >
            {deliveryProjectDisplayName(d)}
          </Link>
        );
      },
    },
    {
      title: 'Alias',
      field: 'alias',
    },
    {
      title: 'Delivery Programme',
      field: 'delivery_programme_name',
    },
    {
      title: 'Description',
      field: 'description',
    },
    {
      title: 'Updated At',
      field: 'updated_at',
      type: 'datetime',
      cellStyle: { whiteSpace: 'nowrap' },
    },
    {
      sorting: false,
      cellStyle: { whiteSpace: 'nowrap' },
      render(d) {
        return (
          <>
            <LinkButton
              to={`${entityRoute(d.name, 'group')}/manage-delivery-project-users`}
              variant="outlined"
              color="default"
              title={`Manage members for ${d.title}. This will open in a new tab`}
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
              title={`Edit ${d.title}`}
            >
              Edit
            </EditDeliveryProjectButton>
          </>
        );
      },
    },
  ];
  columns.forEach(c => {
    c.width ??= '';
    c.headerStyle = { whiteSpace: 'nowrap' };
  });

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
          data={data ?? []}
          columns={columns}
          isCompact
          isLoading={loading}
        />
      </Content>
    </Page>
  );
};
