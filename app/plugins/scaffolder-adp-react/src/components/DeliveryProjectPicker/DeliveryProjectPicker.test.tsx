import React, { act } from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { DeliveryProjectPicker } from './DeliveryProjectPicker';
import type { EntityRefPresentationSnapshot } from '@backstage/plugin-catalog-react';
import { fireEvent, waitFor } from '@testing-library/react';
import { SnapshotFriendlyStylesProvider } from '../../SnapshotFriendlyStylesProvider';
import type { GroupEntity } from '@backstage/catalog-model';
import * as useDeliveryProjectsMod from './useDeliveryProjects';

describe('DeliveryProjectPicker', () => {
  it('Should render loading', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    useDeliveryProjects.mockReturnValue({
      loading: true,
      value: undefined,
    });

    const result = await render({ disabled: false });

    expect(onChange).not.toHaveBeenCalled();
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should render no options when there are no matches', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(0);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({ disabled: false });
    act(() => result.getByTitle('Open').click());

    expect(onChange).not.toHaveBeenCalled();
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should select the only option when there is 1 match', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(1);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({ disabled: false });

    expect(onChange).toHaveBeenCalledWith(entities[0].ref);
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should not select an option when there is more than 1 option', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(10);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({ disabled: false });

    expect(onChange).not.toHaveBeenCalled();
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should show all the options in the drop down', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(10);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({ disabled: false });
    act(() => result.getByTitle('Open').click());

    expect(onChange).not.toHaveBeenCalled();
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should fire change when a selection is made', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(10);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({ disabled: false });
    act(() => result.getByTitle('Open').click());
    act(() => result.getByText('Test Group 3').click());

    expect(onChange).toHaveBeenCalledWith('group:default/test-group-3');
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should filter the results', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(10);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({ disabled: false });
    fireEvent.change(result.getByRole('textbox'), { target: { value: '6' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Should reset when cleared', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(10);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({
      disabled: false,
      formData: 'group:default/test-group-7',
    });
    act(() => result.getByTitle('Clear').click());

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
  it('Show when errored', async () => {
    const { useDeliveryProjects, onChange, render } = setup();
    const entities = makeEntities(10);
    useDeliveryProjects.mockReturnValue({
      loading: false,
      value: {
        catalogEntities: entities.map(e => e.data),
        entityRefToPresentation: new Map(
          entities.map(e => [e.ref, e.presentation]),
        ),
      },
    });

    const result = await render({
      disabled: false,
      rawErrors: ['My error'],
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(useDeliveryProjects).toHaveBeenCalled();
    expect(result.baseElement).toMatchSnapshot();
  });
});

jest.mock('./useDeliveryProjects');
const { useDeliveryProjects } = jest.mocked(useDeliveryProjectsMod);
beforeEach(() => {
  jest.resetAllMocks();
});

function setup() {
  const wrapper = (...[props]: Parameters<typeof DeliveryProjectPicker>) => (
    <SnapshotFriendlyStylesProvider>
      <DeliveryProjectPicker {...props} />
    </SnapshotFriendlyStylesProvider>
  );

  const onChange = jest.fn<void, [string | undefined]>();

  const baseProps: Parameters<typeof wrapper>[0] = {
    onChange,
    schema: {},
    required: true,
    uiSchema: {},
    rawErrors: [],
    formData: undefined,
  } as Partial<typeof baseProps> as typeof baseProps;

  return {
    useDeliveryProjects,
    onChange,
    async render(props: Partial<Parameters<typeof wrapper>[0]>) {
      const result = await renderInTestApp(wrapper({ ...baseProps, ...props }));
      await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
      return result;
    },
  };
}

function makeEntities(count: number) {
  return [...new Array(count)].map<{
    ref: string;
    data: GroupEntity;
    presentation: EntityRefPresentationSnapshot;
  }>((_, i) => ({
    ref: `group:default/test-group-${i}`,
    data: {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: `test-group-${i}`,
        title: `Test Group ${i}`,
      },
      spec: {
        children: [],
        type: 'delivery-project',
      },
    },
    presentation: {
      entityRef: `group:default/test-group-${i}`,
      primaryTitle: `Test Group ${i}`,
    },
  }));
}
