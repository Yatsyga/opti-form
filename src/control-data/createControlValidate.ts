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
  // @ts-expect-error: "noValueError" does not exist on props. Which is obviously wrong. Need to investigate later
  const noValueError: TControlError | undefined = props.noValueError;

  return {
    validate: (props.validate ?? (() => null)) as TValidateControl<Value, Context>,
    noValueError: noValueError ?? null,
    validationDebounceMs,
  };
}
