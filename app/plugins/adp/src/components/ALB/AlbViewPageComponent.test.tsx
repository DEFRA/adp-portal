import React from 'react';
import { act, fireEvent, waitFor, queryByText } from '@testing-library/react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';

import { AlbViewPageComponent } from './AlbViewPageComponent';
import {
  alertApiRef,
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

// Mock APIs
const mockAlertApi = { post: jest.fn() };
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };

const mockTableData = [
  { id: '1', title: 'ALB 1', short_name: 'ALB1', description: 'Description 1', url: 'http://alb1.com', timestamp: '2021-01-01T00:00:00Z' },
  { id: '2', title: 'ALB 2', short_name: 'ALB2', description: 'Description 2', url: 'http://alb2.com', timestamp: '2021-01-02T00:00:00Z' },
];

const mockGetArmsLengthBodies = jest.fn();
const mockUpdateArmsLengthBody = jest.fn().mockResolvedValue({});
jest.mock('../../api/AlbClient', () => ({
  ArmsLengthBodyClient: jest.fn().mockImplementation(() => ({
    getArmsLengthBodies: mockGetArmsLengthBodies,
    updateArmsLengthBody: mockUpdateArmsLengthBody,
  })),
}));

describe('AlbViewPageComponent', () => {
  const element = (
    <TestApiProvider apis={[
      [alertApiRef, mockAlertApi],
      [errorApiRef, mockErrorApi],
      [discoveryApiRef, mockDiscoveryApi],
      [fetchApiRef, mockFetchApi],
    ]}>

      <AlbViewPageComponent />

    </TestApiProvider>
  );
  const render = async () =>
    renderInTestApp(element);

  afterEach(() => {
    mockGetArmsLengthBodies.mockReset();
  });

  it('fetches and displays arms length bodies in the table upon loading', async () => {
    mockGetArmsLengthBodies.mockResolvedValue(mockTableData);
    const rendered = await render();

    await waitFor(() => {
      expect(rendered.getByText('ALB 1')).toBeInTheDocument();
      expect(rendered.getByText('ALB 2')).toBeInTheDocument();
    });
  });

  it('should throw error when albClient throws error', async () => {
    mockGetArmsLengthBodies.mockImplementation(() => {
      throw new Error("Cannot fetch ALB");
    });

    const rendered = await render();

    await waitFor(() => {
      expect(rendered.findByText('Arms Length Bodies')).resolves.toBeInTheDocument();
      expect(mockErrorApi.post).toHaveBeenCalledTimes(1);
    });
  })

  it('should open edit modal when edit button is clicked', async () => {
    mockGetArmsLengthBodies.mockResolvedValue(mockTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId("alb-edit-button-1"));
    });

    await waitFor(() => {
      expect(rendered.getByText("Edit: ALB 1")).toBeInTheDocument();
    });
  });

  it('should close edit modal when close button is clicked', async () => {
    mockGetArmsLengthBodies.mockResolvedValue(mockTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId("alb-edit-button-1"));
    });

    act(() => {
      fireEvent.click(rendered.getByTestId("edit-modal-cancel-button"));
    });

    await waitFor(() => {
      expect(rendered.queryByText("Edit: ALB 1")).not.toBeInTheDocument();
    });
  });

  it('should update the item when update button is clicked', async () => {
    mockGetArmsLengthBodies.mockResolvedValue(mockTableData);
    const updatedTableData = [
      { id: '1', title: 'ALB 1 edited', short_name: 'ALB1', description: 'Description 1', url: 'http://alb1.com', timestamp: '2021-01-01T00:00:00Z' },
      { id: '2', title: 'ALB 2', short_name: 'ALB2', description: 'Description 2', url: 'http://alb2.com', timestamp: '2021-01-02T00:00:00Z' },
    ];
    mockUpdateArmsLengthBody.mockResolvedValue(updatedTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId("alb-edit-button-1"));
    });

    act(() => {
      fireEvent.change(rendered.getByLabelText("Title"), {target: {value: "ALB 1 edited"}})
    });

    act(() => {
      fireEvent.click(rendered.getByTestId("edit-modal-update-button"));
    });
    mockGetArmsLengthBodies.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(rendered.queryByText("Edit: ALB 1")).not.toBeInTheDocument();
      expect(rendered.queryByText("ALB 1 edited")).toBeInTheDocument();
    });
  });

  it('should not update the item when update button is clicked and has a non-unique title', async () => {
    mockGetArmsLengthBodies.mockResolvedValue(mockTableData);
    const updatedTableData = [
      { id: '1', title: 'ALB 2', short_name: 'ALB1', description: 'Description 1', url: 'http://alb1.com', timestamp: '2021-01-01T00:00:00Z' },
      { id: '2', title: 'ALB 2', short_name: 'ALB2', description: 'Description 2', url: 'http://alb2.com', timestamp: '2021-01-02T00:00:00Z' },
    ];
    mockUpdateArmsLengthBody.mockResolvedValue(updatedTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId("alb-edit-button-1"));
    });

    act(() => {
      fireEvent.change(rendered.getByLabelText("Title"), {target: {value: "ALB 2"}})
    });

    act(() => {
      fireEvent.click(rendered.getByTestId("edit-modal-update-button"));
    });
    mockGetArmsLengthBodies.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(rendered.queryByText("Edit: ALB 1")).toBeInTheDocument();
      expect(mockAlertApi.post).toHaveBeenCalledTimes(1);
    });
  });

  it('should open add modal when add button is clicked', async () => {
    mockGetArmsLengthBodies.mockResolvedValue(mockTableData);
    const rendered = await render();
    
    act(() => {
      fireEvent.click(rendered.getByTestId("create-alb-button"));
    });

    await waitFor(() => {
      expect(rendered.getByText("Create:")).toBeInTheDocument();
    });
  });

});