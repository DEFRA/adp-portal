import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Typography } from '@material-ui/core';
import AddBoxIcon from '@mui/icons-material/AddBox';
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
import AccountBoxIcon from '@mui/icons-material/AccountBox';

type DeliveryProgrammeWithActions = DeliveryProgramme & {
  titleLink: ReactNode;
  actions: ReactNode;
};

export const DeliveryProgrammeViewPageComponent = () => {
  const client = useApi(deliveryProgrammeApiRef);
  const entityRoute = useEntityRoute();
  const { data, refresh, loading } = useAsyncDataSource(
    useCallback(() => client.getDeliveryProgrammes(), [client]),
    useErrorCallback({
      name: 'Error while getting the list of delivery programmes.',
    }),
  );

  const tableData = useMemo(
    () =>
      data?.map<DeliveryProgrammeWithActions>(d => {
        const target = entityRoute(d.name, 'group', 'default');
        return {
          ...d,
          titleLink: <Link to={target}>{d.title}</Link>,
          actions: (
            <>
              <LinkButton
                to={`${target}/manage-members`}
                variant="outlined"
                color="default"
                title="View Delivery Programme Admins"
              >
                <AccountBoxIcon />
              </LinkButton>
              &nbsp;
              <EditDeliveryProgrammeButton
                variant="contained"
                color="default"
                deliveryProgramme={d}
                data-testid={`delivery-programme-edit-button-${d.id}`}
                onEdited={refresh}
              >
                Edit
              </EditDeliveryProgrammeButton>
            </>
          ),
        };
      }),
    [data, refresh, entityRoute],
  );

  const columns: TableColumn<DeliveryProgrammeWithActions>[] = [
    {
      title: 'Title',
      field: 'titleLink',
      highlight: true,
    },
    {
      title: 'Alias',
      field: 'alias',
      highlight: false,
      type: 'string',
    },

    {
      title: 'Arms Length Body',
      field: 'arms_length_body_id_name',
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
