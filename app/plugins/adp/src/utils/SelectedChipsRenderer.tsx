import React from 'react';
import { Box, Chip } from '@material-ui/core';

const SelectedChipsRenderer = ({ selected, options }) => {
  if (!Array.isArray(selected) || !Array.isArray(options)) {
    return null;
  }

  const getLabel = (value: any) => {
    const option = options.find(
      (option: { value: any }) => option.value === value,
    );
    return option ? option.label : value;
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
};

export default SelectedChipsRenderer;
