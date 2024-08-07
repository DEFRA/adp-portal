// source: https://github.com/backstage/backstage/blob/v1.28.4/plugins/scaffolder/src/components/fields/VirtualizedListbox.tsx

import React, { createContext, useContext } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';

const renderRow = (props: ListChildComponentProps) => {
  const { data, index, style } = props;
  return React.cloneElement(data[index], { style });
};

const outerItemContext = createContext({});
const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = useContext(outerItemContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

export const VirtualizedListbox = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode }
>(function VirtualizedListbox(props, ref) {
  const { children, ...rest } = props;
  const itemData = React.Children.toArray(props.children);
  const itemCount = itemData.length;

  const itemSize = 36;
  const height = Math.min(itemSize * 10.5, itemSize * (itemCount + 0.5));

  return (
    <div ref={ref}>
      <outerItemContext.Provider value={rest}>
        <FixedSizeList
          height={height}
          itemData={itemData}
          itemCount={itemCount}
          itemSize={itemSize}
          outerElementType={OuterElementType}
          width="100%"
        >
          {renderRow}
        </FixedSizeList>
      </outerItemContext.Provider>
    </div>
  );
});
