import React from 'react';
import type {
  DeliveryProgrammeFields} from './DeliveryProgrammeFormFields';
import {
  DeliveryProgrammeFormFields,
  emptyForm,
} from './DeliveryProgrammeFormFields';
import type {
  RenderResult} from '@testing-library/react';
import {
  fireEvent,
  render as testRender,
  waitFor,
} from '@testing-library/react';
import type {
  FieldPath,
  FieldValues,
  UseFormReturn} from 'react-hook-form';
import {
  useForm,
} from 'react-hook-form';
import { act } from 'react-dom/test-utils';
import type { ArmsLengthBodyApi} from '../ALB/api';
import { armsLengthBodyApiRef } from '../ALB/api';
import { TestApiProvider } from '@backstage/test-utils';
import type { ErrorApi} from '@backstage/core-plugin-api';
import { errorApiRef } from '@backstage/core-plugin-api';
import userEvent from '@testing-library/user-event';

describe('AlbFormFields', () => {
  it('Should render all fields correctly', async () => {
    const { mockAlbApi, render } = setup();

    mockAlbApi.getArmsLengthBodyNames.mockResolvedValueOnce({
      1: 'Alb 1',
      2: 'Alb 2',
    });

    const { result } = await render();

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should render populated fields', async () => {
    const { mockAlbApi, render } = setup();

    mockAlbApi.getArmsLengthBodyNames.mockResolvedValueOnce({
      1: 'Alb 1',
      2: 'Alb 2',
    });

    const fields: DeliveryProgrammeFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      url: 'My url',
      arms_length_body_id: '1',
      delivery_programme_code: 'ABC',
    };

    const { form, result } = await render();

    act(() => {
      for (const [key, value] of Object.entries(fields) as {
        [P in keyof DeliveryProgrammeFields]-?: [P, DeliveryProgrammeFields[P]];
      }[keyof DeliveryProgrammeFields][]) {
        form.setValue(key, value);
      }
    });

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should render default fields', async () => {
    const { mockAlbApi, render } = setup();

    mockAlbApi.getArmsLengthBodyNames.mockResolvedValueOnce({
      1: 'Alb 1',
      2: 'Alb 2',
    });

    const fields: DeliveryProgrammeFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      url: 'My url',
      arms_length_body_id: '1',
      delivery_programme_code: 'ABC',
    };

    const { result } = await render(fields);

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should write values back to the form', async () => {
    const { mockAlbApi, render } = setup();

    mockAlbApi.getArmsLengthBodyNames.mockResolvedValueOnce({
      1: 'Alb 1',
      2: 'Alb 2',
    });

    const fields: DeliveryProgrammeFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      url: 'My url',
      arms_length_body_id: '1',
      delivery_programme_code: 'ABC',
    };

    const { form, result } = await render();

    expect(result.baseElement).toMatchSnapshot('Empty');
    setTextField(result, 'Name', fields.title);
    expect(result.baseElement).toMatchSnapshot('Title set');
    setTextField(result, 'Alias', fields.alias);
    expect(result.baseElement).toMatchSnapshot('Alias set');
    setTextField(result, 'Website', fields.url);
    expect(result.baseElement).toMatchSnapshot('Website set');
    setTextField(result, 'Description', fields.description);
    expect(result.baseElement).toMatchSnapshot('Description set');
    setTextField(
      result,
      'Delivery Programme Code / Abbreviation',
      fields.delivery_programme_code,
    );
    expect(result.baseElement).toMatchSnapshot('Programme Code set');

    await setSelectField(
      result,
      form,
      'Arms Length Body',
      'Alb 1',
      'arms_length_body_id',
    );
    expect(result.baseElement).toMatchSnapshot('Alb selected');

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
  form?: UseFormReturn<DeliveryProgrammeFields>;
};
function setup() {
  const mockErrorApi: jest.Mocked<ErrorApi> = {
    error$: jest.fn(),
    post: jest.fn(),
  };
  const mockAlbApi: jest.Mocked<ArmsLengthBodyApi> = {
    createArmsLengthBody: jest.fn(),
    getArmsLengthBodies: jest.fn(),
    getArmsLengthBodyNames: jest.fn(),
    updateArmsLengthBody: jest.fn(),
  };
  return {
    mockAlbApi,
    mockErrorApi,
    async render(defaultValues?: DeliveryProgrammeFields) {
      const context: Context = {};
      const result = testRender(
        <TestApiProvider
          apis={[
            [armsLengthBodyApiRef, mockAlbApi],
            [errorApiRef, mockErrorApi],
          ]}
        >
          <Sut context={context} defaultValues={defaultValues} />
        </TestApiProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      await waitFor(() =>
        expect(
          mockAlbApi.getArmsLengthBodyNames.mock.calls.length,
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
    readonly defaultValues?: DeliveryProgrammeFields;
  }) {
    context.form = useForm<DeliveryProgrammeFields>({ defaultValues });

    return <DeliveryProgrammeFormFields {...context.form} />;
  }
}
