import React from 'react';
import { Box, Chip } from '@material-ui/core';

function defaultComparer(x: unknown, y: unknown): boolean {
  return x === y;
}

type SelectedChipsRendererProps<TSelected, TOptionValue> = {
  readonly selected: TSelected;
  readonly options: Array<{ label: string; value: TOptionValue }>;
  readonly comparer?: (x: TSelected, y: TOptionValue) => boolean;
};

function SelectedChipsRenderer<TSelected, TOptionValue>({
  selected,
  options,
  comparer = defaultComparer,
}: SelectedChipsRendererProps<TSelected, TOptionValue>) {
  if (!Array.isArray(selected) || !Array.isArray(options)) {
    return null;
  }

  const getLabel = (value: TSelected) => {
    const option = options.find(option => {
      return comparer(value, option.value);
    });
    return option ? option.label : String(value);
  };

  return (
    <Box display="flex" flexWrap="wrap">
      {selected.map(value => (
        <Chip
          key={value}
          label={getLabel(value)}
          color="primary"
          size="small"
        />
      ))}
    </Box>
  );
}

export default SelectedChipsRenderer;
