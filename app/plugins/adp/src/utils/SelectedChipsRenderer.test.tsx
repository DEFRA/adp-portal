import React from 'react';
import { render, screen } from '@testing-library/react';
import SelectedChipsRenderer from './SelectedChipsRenderer';

describe('SelectedChipsRenderer', () => {
  const mockOptions = [
    {
      label: 'name1',
      value: '123',
    },
    {
      label: 'name2',
      value: '1234',
    },
  ];

  it('renders nothing if selected is not an array', () => {
    const { container } = render(
      <SelectedChipsRenderer selected={null} options={mockOptions} />,
    );
    expect(container).toBeEmptyDOMElement();

    render(<SelectedChipsRenderer selected="123" options={mockOptions} />);
    expect(container).toBeEmptyDOMElement();

    render(
      <SelectedChipsRenderer
        selected={{ key: 'value' }}
        options={mockOptions}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly if selected is an array', () => {
    const options = ['name1', 'name2'];
    render(<SelectedChipsRenderer selected={options} options={mockOptions} />);

    options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });
});
