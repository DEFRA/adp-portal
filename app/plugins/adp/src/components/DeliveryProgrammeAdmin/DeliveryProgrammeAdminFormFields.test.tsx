import React from 'react';
import type { DeliveryProgrammeAdminFields } from './DeliveryProgrammeAdminFormFields';
import {
  DeliveryProgrammeAdminFormFields,
  emptyForm,
} from './DeliveryProgrammeAdminFormFields';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { RenderResult } from '@testing-library/react';
import { render, waitFor } from '@testing-library/react';
import type { ErrorApi } from '@backstage/core-plugin-api';
import { errorApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';
import userEvent from '@testing-library/user-event';

type Context = {
  form?: UseFormReturn<DeliveryProgrammeAdminFields>;
};

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

function Sut({
  context,
  defaultValues = emptyForm,
}: {
  readonly context: Context;
  readonly defaultValues?: DeliveryProgrammeAdminFields;
}) {
  context.form = useForm<DeliveryProgrammeAdminFields>({ defaultValues });

  return <DeliveryProgrammeAdminFormFields {...context.form} />;
}

function setup() {
  const mockErrorApi: jest.Mocked<ErrorApi> = {
    error$: jest.fn(),
    post: jest.fn(),
  };

  const mockCatalogApi = {
    getEntities: jest.fn(),
  };

  return {
    mockErrorApi,
    mockCatalogApi,
    async renderComponent(defaultValues?: DeliveryProgrammeAdminFields) {
      const context: Context = {};
      const result = render(
        <TestApiProvider
          apis={[
            [errorApiRef, mockErrorApi],
            [catalogApiRef, mockCatalogApi],
          ]}
        >
          <Sut context={context} defaultValues={defaultValues} />
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result, form: context.form! };
    },
  };
}

describe('DeliveryProgrammeAdminFormFields', () => {
  it('should render all fields correctly', async () => {
    const { renderComponent } = setup();

    const { result } = await renderComponent();

    expect(result.baseElement).toMatchSnapshot();
  });

  it('should render default fields', async () => {
    const { renderComponent } = setup();

    const fields: DeliveryProgrammeAdminFields = {
      aadEntityRefId: 'user-1234',
    };

    const { result } = await renderComponent(fields);

    expect(result.baseElement).toMatchSnapshot();
  });

  it('should write values back to the form', async () => {
    const { renderComponent, mockCatalogApi } = setup();
    mockCatalogApi.getEntities.mockResolvedValue({
      items: [
        {
          apiVersion: 'backstage.io/v1beta1',
          kind: 'User',
          metadata: {
            name: 'test-user-1',
            annotations: {
              ['graph.microsoft.com/user-id']:
                'f8699f8d-e3d5-4822-8979-6b6bce35ff16',
              ['metadata.annotations.microsoft.com/email']: 'user@email.com',
            },
          },
          spec: {
            profile: {
              displayName: 'Test User 1',
              email: 'user@email.com',
            },
          },
        },
      ],
    });

    const fields: DeliveryProgrammeAdminFields = {
      aadEntityRefId: 'f8699f8d-e3d5-4822-8979-6b6bce35ff16',
    };

    const { form, result } = await renderComponent();

    expect(result.baseElement).toMatchSnapshot('Empty');

    await setSelectField(
      result,
      form,
      'Select User',
      'Test User 1',
      'aadEntityRefId',
    );
    expect(result.baseElement).toMatchSnapshot('User selected');
    expect(form.getValues()).toMatchObject(fields);
  });
});
