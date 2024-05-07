import { useEffect, useState } from 'react';

const strictEquals = (left: unknown, right: unknown) => left === right;

export function useComputedUntilChanged<T>({
  currentValue,
  computedValue,
  emptyValue,
  equals,
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

  const realEquals = equals ?? strictEquals;

  useEffect(() => {
    const isReplaceable = realEquals(currentValue, replaceable);
    const isEmptyReplaceable = realEquals(emptyValue, replaceable);
    const computedChanged = !realEquals(computedValue, previousCompute);

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
  }, [
    currentValue,
    computedValue,
    realEquals,
    replaceable,
    emptyValue,
    previousCompute,
    setValue,
  ]);
}
