import React from 'react';
import type { AlbFields } from './AlbFormFields';
import { AlbFormFields, emptyForm } from './AlbFormFields';
import type { RenderResult } from '@testing-library/react';
import {
  fireEvent,
  render as testRender,
  waitFor,
} from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { act } from 'react-dom/test-utils';
import { SnapshotFriendlyStylesProvider } from '../../utils';

describe('AlbFormFields', () => {
  it('Should render all fields correctly', async () => {
    const { render } = setup();

    const { result } = await render();

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should render populated fields', async () => {
    const { render } = setup();

    const fields: AlbFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      url: 'My url',
    };

    const { form, result } = await render();

    act(() => {
      for (const [key, value] of Object.entries(fields) as {
        [P in keyof AlbFields]-?: [P, AlbFields[P]];
      }[keyof AlbFields][]) {
        form.setValue(key, value);
      }
    });

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should render default fields', async () => {
    const { render } = setup();

    const fields: AlbFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      url: 'My url',
    };

    const { result } = await render(fields);

    expect(result.baseElement).toMatchSnapshot();
  });

  it('Should write values back to the form', async () => {
    const { render } = setup();

    const fields: AlbFields = {
      alias: 'My alias',
      description: 'My description',
      title: 'My title',
      url: 'My url',
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

type Context = {
  form?: UseFormReturn<AlbFields>;
};
function setup() {
  return {
    async render(defaultValues?: AlbFields) {
      const context: Context = {};
      const result = testRender(
        <SnapshotFriendlyStylesProvider>
          <Sut context={context} defaultValues={defaultValues} />
        </SnapshotFriendlyStylesProvider>,
      );
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return { result, form: context.form! };
    },
  };

  function Sut({
    context,
    defaultValues = emptyForm,
  }: {
    readonly context: Context;
    readonly defaultValues?: AlbFields;
  }) {
    context.form = useForm<AlbFields>({ defaultValues });

    return <AlbFormFields {...context.form} />;
  }
}
