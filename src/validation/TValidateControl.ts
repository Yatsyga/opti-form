import { TControlValue } from '../TControlValue';
import { TControlValidationResult } from './TControlValidationResult';

export type TValidateControl<
  Value,
  Context,
> = (value: TControlValue<Value>, context: Context) => TControlValidationResult;

export type TValidateValueArg<Value> = undefined extends Value
  ? TControlValue<Value>
  : Exclude<TControlValue<Value>, undefined>;
