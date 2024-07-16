import { TControlValue } from '../TControlValue';
import { TControlValidationResult } from './TControlValidationResult';

/**
 * Type for control validation callback.
 * If "noValueError" for control is provided, then this callback will be called only if value !== undefined.
 * @param value control value
 * @param context validation context. If "usesContext" !== true in control data, then this argument will not be provided.
 */
export type TValidateControl<
  Value,
  Context,
> = (value: TControlValue<Value>, context: Context) => TControlValidationResult;

export type TValidateValueArg<Value> = undefined extends Value
  ? TControlValue<Value>
  : Exclude<TControlValue<Value>, undefined>;
