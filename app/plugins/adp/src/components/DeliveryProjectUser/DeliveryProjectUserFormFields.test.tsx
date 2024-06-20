import React from 'react';
import type { DeliveryProjectUserFields } from './DeliveryProjectUserFormFields';
import {
  DeliveryProjectUserFormFields,
  emptyForm,
} from './DeliveryProjectUserFormFields';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ErrorApi } from '@backstage/core-plugin-api';
import { errorApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';
import type { RenderResult } from '@testing-library/react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import userEvent from '@testing-library/user-event';
import { SnapshotFriendlyStylesProvider } from '../../utils';

type Context = {
  form?: UseFormReturn<DeliveryProjectUserFields>;
};

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

function Sut({
  context,
  defaultValues = emptyForm,
}: {
  readonly context: Context;
  readonly defaultValues?: DeliveryProjectUserFields;
}) {
  context.form = useForm<DeliveryProjectUserFields>({ defaultValues });

  return <DeliveryProjectUserFormFields {...context.form} />;
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
    async renderComponent(defaultValues?: DeliveryProjectUserFields) {
      const context: Context = {};
      const result = render(
        <TestApiProvider
          apis={[
            [errorApiRef, mockErrorApi],
            [catalogApiRef, mockCatalogApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <Sut context={context} defaultValues={defaultValues} />
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result, form: context.form! };
    },
  };
}

describe('DeliveryProjectUserFormFields', () => {
  it('should render all fields correctly', async () => {
    const { renderComponent } = setup();
    const { result } = await renderComponent();
    await waitForLoadingDone(result);
    expect(result.baseElement).toMatchSnapshot();
  });

  it('should render default fields', async () => {
    const { renderComponent } = setup();

    const fields: DeliveryProjectUserFields = {
      user_catalog_name: { label: 'user-1234', value: 'user-1234' },
      github_username: 'user-1234',
      is_admin: false,
      is_technical: true,
    };

    const { result } = await renderComponent(fields);
    await waitForLoadingDone(result);

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

    const fields: DeliveryProjectUserFields = {
      user_catalog_name: { label: 'Test User 1', value: 'test-user-1' },
      github_username: 'test-user-1',
      is_admin: false,
      is_technical: false,
    };

    const { form, result } = await renderComponent();
    await waitForLoadingDone(result);

    expect(result.baseElement).toMatchSnapshot('Empty');

    await setSelectField(
      result,
      form,
      'Select User',
      'Test User 1',
      'user_catalog_name',
    );
    expect(result.baseElement).toMatchSnapshot('User selected');

    setTextField(result, 'GitHub Handle', fields.github_username);
    expect(result.baseElement).toMatchSnapshot('GitHub Handle set');

    expect(form.getValues()).toMatchObject(fields);
  });
});

async function waitForLoadingDone(result: RenderResult) {
  await waitFor(() =>
    expect(result.queryByRole('progressbar')).not.toBeInTheDocument(),
  );
}
