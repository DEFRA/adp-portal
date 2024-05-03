import React, { useState, useEffect, useReducer } from 'react';
import { Button, Typography } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  TableColumn,
  LinkButton,
  Link,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils/Table';
import { ActionsModal } from '../../utils/ActionsModal';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';
import {
  DeliveryProgramme,
  adpProgrammmeCreatePermission,
} from '@internal/plugin-adp-common';
import CreateDeliveryProgramme from './CreateDeliveryProgramme';
import { DeliveryProgrammeClient } from './api/DeliveryProgrammeClient';
import { DeliveryProgrammeApi } from './api/DeliveryProgrammeApi';
import { DeliveryProgrammeFormFields } from './DeliveryProgrammeFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  isCodeUnique,
  isNameUnique,
} from '../../utils/DeliveryProgramme/DeliveryProgrammeUtils';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import {
  useEntityRoute,
  useArmsLengthBodyList,
  transformedData,
  useProgrammeManagersList,
} from '../../hooks';

type FormDataModel =
  | Record<string, never>
  | (Omit<DeliveryProgramme, 'programme_managers'> & {
      programme_managers: string[];
    });

export const DeliveryProgrammeViewPageComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormDataModel>({});
  const [tableData, setTableData] = useState<DeliveryProgramme[]>([]);
  const [key, refetchDeliveryProgramme] = useReducer(i => {
    return i + 1;
  }, 0);

  const alertApi = useApi(alertApiRef);
  const errorApi = useApi(errorApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const getArmsLengthBodyDropDown = useArmsLengthBodyList();
  const getProgrammeManagerDropDown = useProgrammeManagersList();
  const entityRoute = useEntityRoute;

  const deliveryprogClient: DeliveryProgrammeApi = new DeliveryProgrammeClient(
    discoveryApi,
    fetchApi,
  );

  const { allowed: allowedToEditAdpProgramme } = usePermission({
    permission: adpProgrammmeCreatePermission,
  });

  const getAllDeliveryProgrammes = async () => {
    try {
      const data = await deliveryprogClient.getDeliveryProgrammes();
      setTableData(data);
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllDeliveryProgrammes();
  }, [key]);

  const handleEdit = async (deliveryProgramme: DeliveryProgramme) => {
    try {
      const detailedProgramme =
        await deliveryprogClient.getDeliveryProgrammeById(deliveryProgramme.id);
      setFormData({
        ...detailedProgramme,
        programme_managers: detailedProgramme.programme_managers.map(
          m => m.aad_entity_ref_id,
        ),
      });
      setIsModalOpen(true);
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  const handleCloseModal = () => {
    setFormData({});
    setIsModalOpen(false);
  };

  const handleUpdate = async (deliveryProgramme: DeliveryProgramme) => {
    if (
      !isNameUnique(tableData, deliveryProgramme.title, deliveryProgramme.id)
    ) {
      setIsModalOpen(true);

      alertApi.post({
        message: `The title '${deliveryProgramme.title}' is already in use. Please choose a different title.`,
        severity: 'error',
        display: 'permanent',
      });

      return;
    }

    if (
      !isCodeUnique(
        tableData,
        deliveryProgramme.delivery_programme_code,
        deliveryProgramme.id,
      )
    ) {
      setIsModalOpen(true);

      alertApi.post({
        message: `The delivery programme code '${deliveryProgramme.delivery_programme_code}' is already in use. Please choose a different code.`,
        severity: 'error',
        display: 'permanent',
      });

      return;
    }

    try {
      await deliveryprogClient.updateDeliveryProgramme(deliveryProgramme);
      alertApi.post({
        message: `Updated`,
        severity: 'success',
        display: 'transient',
      });
      refetchDeliveryProgramme();
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  const getOptionFields = () => {
    return DeliveryProgrammeFormFields.map(field => {
      if (field.name === 'arms_length_body_id') {
        return {
          ...field,
          options: getArmsLengthBodyDropDown,
        };
      } else if (field.name === 'programme_managers') {
        return {
          ...field,
          options: getProgrammeManagerDropDown,
        };
      }
      return field;
    });
  };

  const columns: TableColumn[] = [
    {
      title: 'Title',
      field: 'title',
      highlight: true,
      type: 'string',
      render: (row: Partial<DeliveryProgramme>) => {
        const target = entityRoute(row.name!, 'group', 'default');
        return <Link to={target}>{row.title!}</Link>;
      },
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
      align: 'right',
      render: (row: Partial<DeliveryProgramme>) => {
        const target = entityRoute(row.name!, 'group', 'default');
        return (
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
            {allowedToEditAdpProgramme && (
              <Button
                variant="contained"
                color="default"
                onClick={() => handleEdit(row as DeliveryProgramme)}
                data-testid={`delivery-programme-edit-button-${row.id}`}
              >
                Edit
              </Button>
            )}
          </>
        );
      },
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
          <CreateDeliveryProgramme
            refetchDeliveryProgramme={refetchDeliveryProgramme}
          />
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Delivery Programmes to the Azure Developer Platform.
        </Typography>

        <DefaultTable
          data={tableData}
          columns={columns}
          title="View all"
          isCompact={true}
        />

        {isModalOpen && allowedToEditAdpProgramme && (
          <ActionsModal
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleUpdate}
            transformedData={transformedData}
            initialValues={formData}
            mode="edit"
            fields={getOptionFields()}
          />
        )}
      </Content>
    </Page>
  );
};
