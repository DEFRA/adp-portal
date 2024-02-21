import React, { useState, useEffect, useReducer } from 'react';
import { Button, Typography } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  TableColumn,
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
  ArmsLengthBody,
  adpProgrammmeCreatePermission,
} from '@internal/plugin-adp-common';
import { ArmsLengthBodyClient } from './api/AlbClient';
import { ArmsLengthBodyApi } from './api/AlbApi';
import CreateAlb from './CreateAlb';
import { albFormFields } from './AlbFormFields';
import { usePermission } from '@backstage/plugin-permission-react';

export const AlbViewPageComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [tableData, setTableData] = useState<ArmsLengthBody[]>([]);
  const [key, refetchArmsLengthBody] = useReducer(i => i + 1, 0);
  const alertApi = useApi(alertApiRef);
  const errorApi = useApi(errorApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const fields = albFormFields;

  const albClient: ArmsLengthBodyApi = new ArmsLengthBodyClient(
    discoveryApi,
    fetchApi,
  );

  const { allowed } = usePermission({
    permission: adpProgrammmeCreatePermission,
  });

  const getAllArmsLengthBodies = async () => {
    try {
      const data = await albClient.getArmsLengthBodies();
      setTableData(data);
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllArmsLengthBodies();
  }, [key]);

  const handleEdit = (ArmsLengthBody: React.SetStateAction<{}>) => {
    setFormData(ArmsLengthBody);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setFormData({});
    setIsModalOpen(false);
  };

  const isNameUnique = (title: string, id: string) => {
    return !tableData.some(
      item =>
        item.title.toLowerCase() === title.toLowerCase() && item.id !== id,
    );
  };

  const handleUpdate = async (armsLengthBody: ArmsLengthBody) => {
    if (!isNameUnique(armsLengthBody.title, armsLengthBody.id)) {
      setIsModalOpen(true);

      alertApi.post({
        message: `The name '${armsLengthBody.title}' is already in use. Please choose a different name.`,
        severity: 'error',
        display: 'permanent',
      });

      return;
    }

    try {
      await albClient.updateArmsLengthBody(armsLengthBody);
      alertApi.post({
        message: `Updated`,
        severity: 'success',
        display: 'transient',
      });
      refetchArmsLengthBody();
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  const columns: TableColumn[] = [
    {
      title: 'Title',
      field: 'title',
      highlight: true,
      type: 'string',
    },
    {
      title: 'Short Name',
      field: 'short_name',
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
      title: 'Website',
      field: 'url',
      highlight: false,
      type: 'string',
    },
    {
      title: 'Created',
      field: 'timestamp',
      render: (data: {}) => {
        const e = data as ArmsLengthBody;
        return new Date(e.timestamp).toLocaleString();
      },
      highlight: false,
      type: 'date',
    },

    {
      title: '',
      highlight: true,
      render: (rowData: {}) => {
        const alb = rowData as ArmsLengthBody;
        return (
          allowed && (
            <Button
              variant="contained"
              color="default"
              onClick={() => handleEdit(rowData)}
              data-testid={`alb-edit-button-${alb.id}`}
            >
              Edit
            </Button>
          )
        );
      },
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Azure Development Platform: Data"
        subtitle="ADP Platform Configuration"
      />
      <Content>
        <ContentHeader title="Arms Length Bodies">
          <CreateAlb refetchArmsLengthBody={refetchArmsLengthBody} />
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Arms Length Bodies to the Azure Developer Platform.
        </Typography>
        <DefaultTable data={tableData} columns={columns} title="View all" />

        {isModalOpen && allowed && (
          <ActionsModal
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleUpdate}
            initialValues={formData}
            mode="edit"
            fields={fields}
          />
        )}
      </Content>
    </Page>
  );
};
