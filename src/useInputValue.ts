import { useCallback, useLayoutEffect, useState } from "react";
import { TControlValue } from "./TControlValue";
import { TControl } from "./controls";

export function useInputValue<T>(control: TControl<T>) {
  const [value, setValue] = useState<TControlValue<T>>(control.value);

  useLayoutEffect(() => setValue(control.value), [control.value]);

  const onChange = useCallback((newValue: TControlValue<T>) => {
    setValue(newValue);
    control.setValue(newValue as any);
  }, [control]);

  return [value, onChange] as const;
}