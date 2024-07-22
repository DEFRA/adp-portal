// source: https://github.com/backstage/backstage/blob/v1.28.4/plugins/scaffolder/src/components/fields/VirtualizedListbox.tsx

import React from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';

const renderRow = (props: ListChildComponentProps) => {
  const { data, index, style } = props;
  return React.cloneElement(data[index], { style });
};

export const VirtualizedListbox = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode }
>((props, ref) => {
  const itemData = React.Children.toArray(props.children);
  const itemCount = itemData.length;

  const itemSize = 36;

  const itemsToShow = Math.min(10, itemCount);
  const height = Math.max(itemSize, itemsToShow * itemSize - 0.5 * itemSize);

  return (
    <div ref={ref}>
      <FixedSizeList
        height={height}
        itemData={itemData}
        itemCount={itemCount}
        itemSize={itemSize}
        width="100%"
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});
