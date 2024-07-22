import React, { useCallback } from 'react';
import { Typography } from '@material-ui/core';
import AddBoxIcon from '@material-ui/icons/AddBox';
import AccountBoxIcon from '@mui/icons-material/ManageAccounts';
import type { TableColumn } from '@backstage/core-components';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  LinkButton,
  Link,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils';
import { useApi } from '@backstage/core-plugin-api';
import type { DeliveryProgramme } from '@internal/plugin-adp-common';
import { deliveryProgrammeApiRef } from './api/DeliveryProgrammeApi';
import { CreateDeliveryProgrammeButton } from './CreateDeliveryProgrammeButton';
import { EditDeliveryProgrammeButton } from './EditDeliveryProgrammeButton';
import {
  useAsyncDataSource,
  useEntityRoute,
  useErrorCallback,
} from '../../hooks';

export const DeliveryProgrammeViewPageComponent = () => {
  const client = useApi(deliveryProgrammeApiRef);
  const entityRoute = useEntityRoute();
  const { data, refresh, loading } = useAsyncDataSource(
    useCallback(() => client.getDeliveryProgrammes(), [client]),
    useErrorCallback({
      name: 'Error while getting the list of delivery programmes.',
    }),
  );

  const columns: TableColumn<DeliveryProgramme>[] = [
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
            {d.title}
          </Link>
        );
      },
    },
    {
      title: 'Alias',
      field: 'alias',
    },

    {
      title: 'Arms Length Body',
      field: 'arms_length_body_id_name',
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
              to={`${entityRoute(d.name, 'group')}/manage-delivery-programme-admins`}
              variant="outlined"
              color="default"
              title={`Manage members for ${d.title}. This will open in a new tab`}
            >
              <AccountBoxIcon />
            </LinkButton>
            <EditDeliveryProgrammeButton
              variant="contained"
              color="default"
              deliveryProgramme={d}
              data-testid={`delivery-programme-edit-button-${d.id}`}
              onEdited={refresh}
              title={`Edit ${d.title}`}
            >
              Edit
            </EditDeliveryProgrammeButton>
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
        <ContentHeader title="Delivery Programmes">
          <CreateDeliveryProgrammeButton
            variant="contained"
            size="large"
            color="primary"
            data-testid="delivery-programme-add-button"
            startIcon={<AddBoxIcon />}
            onCreated={refresh}
          >
            Add Delivery Programme
          </CreateDeliveryProgrammeButton>
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Delivery Programmes to the Azure Developer Platform.
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
