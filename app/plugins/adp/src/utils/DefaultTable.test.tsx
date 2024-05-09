import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { DefaultTable } from './DefaultTable';

describe('DefaultTable', () => {
  const columns = [
    { title: 'Name', field: 'name' },
    { title: 'Age', field: 'age' },
  ];

  const data = [
    { id: 1, name: 'Zoe', age: 30 },
    { id: 2, name: 'Angela', age: 65 },
  ];

  it('renders the table with the correct title', () => {
    render(<DefaultTable data={data} columns={columns} title="Test Table" />);
    expect(screen.getByText('Test Table')).toBeInTheDocument();
  });

  it('renders the correct number of columns', () => {
    render(<DefaultTable data={data} columns={columns} title="Test Table" />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(columns.length);
  });

  it('renders 8 rows as default number of rows for pagination at default 5', () => {
    render(<DefaultTable data={data} columns={columns} title="Test Table" />);
    expect(screen.getAllByRole('row')).toHaveLength(8);
  });

  it('should sort the table by the selected column descending alphabetically by clicking twice', () => {
    render(<DefaultTable data={data} columns={columns} title="Test Table" />);
    const nameColumnHeaders = screen.getAllByRole('button', { name: /name/i });
    const nameColumnHeader = nameColumnHeaders[0];

    fireEvent.click(nameColumnHeader);
    fireEvent.click(nameColumnHeader);

    const firstDataRow = screen.getAllByRole('row')[1];
    const nameCell = within(firstDataRow).getAllByRole('cell')[0];
    const cellValue = nameCell.getAttribute('value');

    expect(cellValue).toBe('Zoe');
  });

  it('should sort the table by the selected column ascending numerically by clicking once', () => {
    render(<DefaultTable data={data} columns={columns} title="Test Table" />);
    const nameColumnHeaders = screen.getAllByRole('button', { name: /age/i });
    const nameColumnHeader = nameColumnHeaders[0];

    fireEvent.click(nameColumnHeader);

    const firstDataRow = screen.getAllByRole('row')[1];
    const nameCell = within(firstDataRow).getAllByRole('cell')[0];
    const cellValue = nameCell.getAttribute('value');

    expect(cellValue).toBe('Zoe');
  });

  it('filters based on input and shows correct result', async () => {
    render(<DefaultTable data={data} columns={columns} title="Test Table" />);

    const inputField = screen.getByPlaceholderText('Filter');
    fireEvent.change(inputField, { target: { value: 'Zoe' } });
    fireEvent.keyPress(inputField, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(screen.queryByText('Angela')).not.toBeInTheDocument();
    });
  });
});
