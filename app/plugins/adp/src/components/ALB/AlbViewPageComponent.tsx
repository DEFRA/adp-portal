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
import { EditModal } from '../../utils/EditModal';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';
import { ArmsLengthBody } from '@internal/plugin-adp-backend';
import { armsLengthBodyClient } from '../../api/AlbClient';
import { armsLengthBodyApi } from '../../api/AlbApi';
import CreateAlb from './CreateAlb';
import { albFormFields } from './AlbFormFields';


export const AlbViewPageComponent = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [tableData, setTableData] = useState<ArmsLengthBody[]>([]);
  const [key, refetchArmsLengthBody] = useReducer(i => i + 1, 0);
  const alertApi = useApi(alertApiRef);
  const errorApi = useApi(errorApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const fields = albFormFields;

  const albClient: armsLengthBodyApi = new armsLengthBodyClient(
    discoveryApi,
    fetchApi,
  );

  const getAllArmsLengthBodies = async () => {
    try {
      const data = await albClient.getArmsLengthBodies();
      console.log(data)
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
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setFormData({});
    setModalOpen(false);
  };

  const isNameUnique = (title: string, id: string) => {
    return !tableData.some(
      item => item.title.toLowerCase() === title.toLowerCase() && item.id !== id,
    );
  };

  const handleUpdate = async (armsLengthBody: ArmsLengthBody) => {
    if (!isNameUnique(armsLengthBody.title, armsLengthBody.id)) {
      setModalOpen(true);

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
      alertApi.post({
        message: e.message,
        severity: 'error',
        display: 'permanent',
      });
      throw e;
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
      highlight: true,
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
      title: 'Updated at',
      field: 'timestamp',
      render: (data: {}) => {
        const e = data as ArmsLengthBody;
        return new Date(e.timestamp).toLocaleString();
      },
      highlight: false,
      type: 'date',
    },

    {
      title: 'Action',
      highlight: true,
      render: rowData => (
        <Button
          variant="contained"
          color="default"
          onClick={() => handleEdit(rowData)}
        >
          Edit
        </Button>
      ),
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
        {isModalOpen && (
          <EditModal
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