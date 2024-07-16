import { ControlType } from '../ControlType';
import { TControlBasicValue } from '../values';
import { createControlValidate } from './createControlValidate';
import { TControlDataBasic, TControlValidationData } from './types';

type ICreationProps<
  Value extends TControlBasicValue | undefined,
  Context,
> = TControlValidationData<Value, Context>;

export function createBasic<Value extends TControlBasicValue, Context = unknown>(
  props: ICreationProps<Value, Context>
): TControlDataBasic<Value, Context> {
  const { validate, noValueError, validationDebounceMs } = createControlValidate<Value, Context>(props);

  return {
    type: ControlType.basic,
    validationDebounceMs,
    descendantsUsePassedContext: false,
    usesContext: props.usesContext ?? false,
    validate,
    noValueError,
  };
}
