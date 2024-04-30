import { useEffect, useState } from 'react';

export function useComputedUntilChanged<T>({
  currentValue,
  computedValue,
  emptyValue,
  equals = (l, r) => l === r,
  setValue,
}: {
  emptyValue: T;
  currentValue: T;
  computedValue: T;
  setValue: (value: T) => void;
  equals?: (left: T, right: T) => boolean;
}) {
  const [replaceable, setReplaceable] = useState(currentValue);
  const [previousCompute, setPreviousCompute] = useState(computedValue);

  useEffect(() => {
    const isReplaceable = equals(currentValue, replaceable);
    const isEmptyReplaceable = equals(emptyValue, replaceable);
    const computedChanged = !equals(computedValue, previousCompute);

    if (isReplaceable) {
      if (computedChanged) {
        setValue(computedValue);
        setReplaceable(computedValue);
      }
    } else if (!isEmptyReplaceable) {
      setReplaceable(emptyValue);
    }

    if (computedChanged) {
      setPreviousCompute(computedValue);
    }
  }, [currentValue, computedValue, replaceable, previousCompute]);
}
