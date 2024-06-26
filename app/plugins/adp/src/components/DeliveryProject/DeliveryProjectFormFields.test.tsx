import React from 'react';
import type { DeliveryProjectFields } from './DeliveryProjectFormFields';
import {
  DeliveryProjectFormFields,
  emptyForm,
} from './DeliveryProjectFormFields';
import type { RenderResult } from '@testing-library/react';
import {
  fireEvent,
  render as testRender,
  waitFor,
} from '@testing-library/react';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { TestApiProvider } from '@backstage/test-utils';
import type { ErrorApi, IdentityApi } from '@backstage/core-plugin-api';
import { errorApiRef, identityApiRef } from '@backstage/core-plugin-api';
import userEvent from '@testing-library/user-event';
import type { DeliveryProgrammeApi } from '../DeliveryProgramme/api';
import { deliveryProgrammeApiRef } from '../DeliveryProgramme/api';
import { SnapshotFriendlyStylesProvider } from '../../utils';

describe('DeliveryProjectFormFields', () => {
  it('Should render all fields correctly', async () => {
    const { mockProgrammeApi, mockIdentityApi, render } = setup();

    mockIdentityApi.getProfileInfo.mockResolvedValueOnce({
      email: 'x@y.com',
    });
    mockProgrammeApi.getDeliveryProgrammeAdmins.mockResolvedValueOnce([
      {
        id: '1',
        delivery_programme_id: '1',
        aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
        email: 'x@y.com',
        name: 'manager1',
        updated_at: new Date(0),
      },
    ]);
    mockProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Programme 1',
        arms_length_body_id: '',
        created_at: new Date(0),
        delivery_programme_code: 'XYZ',
        description: '',
        name: '',
        delivery_programme_admins: [],
        updated_at: new Date(0),
      },
    ]);

    const { result } = await render();

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should render populated fields', async () => {
    const { mockProgrammeApi, mockIdentityApi, render } = setup();

    mockIdentityApi.getProfileInfo.mockResolvedValueOnce({
      email: 'x@y.com',
    });
    mockProgrammeApi.getDeliveryProgrammeAdmins.mockResolvedValueOnce([
      {
        id: '1',
        delivery_programme_id: '1',
        aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
        email: 'x@y.com',
        name: 'manager1',
        updated_at: new Date(0),
      },
    ]);
    mockProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Programme 1',
        arms_length_body_id: '',
        created_at: new Date(0),
        delivery_programme_code: 'XYZ',
        description: '',
        name: '',
        delivery_programme_admins: [],
        updated_at: new Date(0),
      },
    ]);

    const fields: DeliveryProjectFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      ado_project: 'My ado project',
      delivery_programme_id: '1',
      delivery_project_code: 'ABC',
      github_team_visibility: 'public',
      namespace: 'XYZ-ABC',
      service_owner: 'test@email.com',
      team_type: 'delivery',
      finance_code: '123',
    };

    const { form, result } = await render();

    React.act(() => {
      for (const [key, value] of Object.entries(fields) as {
        [P in keyof DeliveryProjectFields]-?: [P, DeliveryProjectFields[P]];
      }[keyof DeliveryProjectFields][]) {
        form.setValue(key, value);
      }
    });

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should render default fields', async () => {
    const { mockProgrammeApi, mockIdentityApi, render } = setup();

    mockIdentityApi.getProfileInfo.mockResolvedValueOnce({
      email: 'x@y.com',
    });
    mockProgrammeApi.getDeliveryProgrammeAdmins.mockResolvedValueOnce([
      {
        id: '1',
        delivery_programme_id: '1',
        aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
        email: 'x@y.com',
        name: 'manager1',
        updated_at: new Date(0),
      },
    ]);
    mockProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Programme 1',
        arms_length_body_id: '',
        created_at: new Date(0),
        delivery_programme_code: 'XYZ',
        description: '',
        name: '',
        delivery_programme_admins: [],
        updated_at: new Date(0),
      },
    ]);

    const fields: DeliveryProjectFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      ado_project: 'My ado project',
      delivery_programme_id: '1',
      delivery_project_code: 'ABC',
      github_team_visibility: 'public',
      namespace: 'XYZ-ABC',
      service_owner: 'test@email.com',
      team_type: 'delivery',
      finance_code: '123',
    };

    const { result } = await render(fields);

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should write values back to the form', async () => {
    const { mockProgrammeApi, mockIdentityApi, render } = setup();

    mockIdentityApi.getProfileInfo.mockResolvedValueOnce({
      email: 'x@y.com',
    });
    mockProgrammeApi.getDeliveryProgrammeAdmins.mockResolvedValueOnce([
      {
        id: '1',
        delivery_programme_id: '1',
        aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
        email: 'x@y.com',
        name: 'manager1',
        updated_at: new Date(0),
      },
    ]);
    mockProgrammeApi.getDeliveryProgrammes.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Programme 1',
        arms_length_body_id: '',
        created_at: new Date(0),
        delivery_programme_code: 'XYZ',
        description: '',
        name: '',
        delivery_programme_admins: [],
        updated_at: new Date(0),
      },
    ]);

    const fields: DeliveryProjectFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      ado_project: 'My ado project',
      delivery_programme_id: '1',
      delivery_project_code: 'ABC',
      github_team_visibility: 'public',
      namespace: '',
      service_owner: 'test@email.com',
      team_type: 'delivery',
      finance_code: '123',
    };

    const { form, result } = await render({
      ...emptyForm,
      team_type: 'delivery',
    });

    expect(result.baseElement).toMatchSnapshot('Empty');
    await setSelectField(
      result,
      form,
      'Delivery Programme',
      'Programme 1',
      'delivery_programme_id',
    );
    expect(result.baseElement).toMatchSnapshot('Programme set');
    setTextField(result, 'Name', fields.title);
    expect(result.baseElement).toMatchSnapshot('Title set');
    setTextField(result, 'Alias', fields.alias);
    expect(result.baseElement).toMatchSnapshot('Alias set');
    setTextField(result, 'Description', fields.description);
    expect(result.baseElement).toMatchSnapshot('Description set');
    await setSelectField(
      result,
      form,
      'GitHub Team Visibility',
      'Publicly visible',
      'github_team_visibility',
    );
    expect(result.baseElement).toMatchSnapshot('Github visibility set');
    setTextField(result, 'CCoE Service Code', fields.delivery_project_code);
    expect(result.baseElement).toMatchSnapshot('Project code set');
    setTextField(result, 'CCoE Finance Cost Center Code', fields.finance_code);
    expect(result.baseElement).toMatchSnapshot('Finance code set');
    setTextField(result, 'Business Service Owner', fields.service_owner);
    expect(result.baseElement).toMatchSnapshot('Service owner set');
    setTextField(result, 'Azure DevOps Project', fields.ado_project);
    expect(result.baseElement).toMatchSnapshot('Ado project set');

    expect(form.getValues()).toMatchObject(fields);
  });
});

function setTextField(
  result: RenderResult,
  label: string,
  value: string | undefined,
) {
  fireEvent.change(result.getByLabelText(label), {
    target: { value: value },
  });
}

async function setSelectField<
  TForm extends FieldValues,
  TPath extends FieldPath<TForm>,
>(
  result: RenderResult,
  form: UseFormReturn<TForm>,
  label: string,
  option: string,
  field: TPath,
) {
  const oldValue = form.getValues(field);
  await userEvent.click(result.getByLabelText(label));
  await waitFor(() => userEvent.click(result.getByText(option)));
  await waitFor(() => expect(form.getValues(field)).not.toBe(oldValue));
}

type Context = {
  form?: UseFormReturn<DeliveryProjectFields>;
};
function setup() {
  const mockErrorApi: jest.Mocked<ErrorApi> = {
    error$: jest.fn(),
    post: jest.fn(),
  };
  const mockIdentityApi: jest.Mocked<IdentityApi> = {
    getBackstageIdentity: jest.fn(),
    getCredentials: jest.fn(),
    getProfileInfo: jest.fn(),
    signOut: jest.fn(),
  };
  const mockProgrammeApi: jest.Mocked<DeliveryProgrammeApi> = {
    createDeliveryProgramme: jest.fn(),
    getDeliveryProgrammeAdmins: jest.fn(),
    getDeliveryProgrammeById: jest.fn(),
    getDeliveryProgrammes: jest.fn(),
    updateDeliveryProgramme: jest.fn(),
  };
  return {
    mockProgrammeApi,
    mockErrorApi,
    mockIdentityApi,
    async render(defaultValues?: DeliveryProjectFields) {
      const context: Context = {};
      const result = testRender(
        <TestApiProvider
          apis={[
            [deliveryProgrammeApiRef, mockProgrammeApi],
            [identityApiRef, mockIdentityApi],
            [errorApiRef, mockErrorApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <Sut context={context} defaultValues={defaultValues} />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      await waitFor(() =>
        expect(
          mockProgrammeApi.getDeliveryProgrammes.mock.calls.length,
        ).toBeGreaterThan(0),
      );
      await waitFor(() =>
        expect(
          mockProgrammeApi.getDeliveryProgrammeAdmins.mock.calls.length,
        ).toBeGreaterThan(0),
      );
      return { result, form: context.form! };
    },
  };

  function Sut({
    context,
    defaultValues = emptyForm,
  }: {
    readonly context: Context;
    readonly defaultValues?: DeliveryProjectFields;
  }) {
    context.form = useForm<DeliveryProjectFields>({ defaultValues });

    return <DeliveryProjectFormFields {...context.form} />;
  }
}
