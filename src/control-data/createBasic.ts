import { ControlType } from '../ControlType';
import { TControlBasicValue } from '../values';
import { createControlValidate } from './createControlValidate';
import { TControlDataBasic, TControlValidationData, TControlValidationDataLoose } from './types';

type ICreationProps<
  Value extends TControlBasicValue | undefined,
  Context,
> = TControlValidationData<Value, Context>;

type ICreationPropsLoose<
  Value extends TControlBasicValue | undefined,
  Context,
> = TControlValidationDataLoose<Value, Context>;

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

/**
 * @deprecated A wrapper of actual createBasic to make it work with non strict mode. Do not use it in strict mode
 */
export function createBasicLoose<Value extends TControlBasicValue, Context = unknown>(
  props: ICreationPropsLoose<Value, Context>
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
