import { useCallback, useLayoutEffect, useState } from "react";
import { TControlValue } from "./TControlValue";
import { TControl } from "./controls";

/**
 * OptiForm applies value updates asynchronously for optimization reasons.
 * However due to that it might make regular inputs (the ones where user types the value) behave weirdly.
 * If caret is in the end of the input everything will work fine, but if user moves caret anywhere else and then types, caret will be moved to the end.
 * This hook solves this specific issue. You do not need to use it with any other type of input.
 */
export function useInputValue<T>(control: TControl<T>) {
  const [value, setValue] = useState<TControlValue<T>>(control.value);

  useLayoutEffect(() => setValue(control.value), [control.value]);

  const onChange = useCallback((newValue: TControlValue<T>) => {
    setValue(newValue);
    control.setValue(newValue as any);
  }, [control]);

  return [value, onChange] as const;
}