import { TControlError, TValidateControl } from '../validation';
import { TControlValidationData } from './types';

interface TControlValidationProps<Value, Context> {
  validationDebounceMs: number;
  validate: TValidateControl<Value, Context>;
  noValueError: TControlError | null;
}

export function createControlValidate<Value, Context>(
  props: TControlValidationData<Value, Context>
): TControlValidationProps<Value, Context> {
  const validationDebounceMs =
    typeof props.validationDebounceMs === 'number' && props.validationDebounceMs > 0 ? props.validationDebounceMs : 0;
  const noValueError: TControlError | undefined = (props as any).noValueError;

  return {
    validate: (props.validate ?? (() => null)) as TValidateControl<Value, Context>,
    noValueError: noValueError ?? null,
    validationDebounceMs,
  };
}
