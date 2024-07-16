import { TIsBasicControlValue } from './types';
import { TControlArrayValue, TControlObjectValue } from './values';

export type TControlValue<Value> =
  | undefined
  | (NonNullable<Value> extends TControlArrayValue
      ? Value
      : TIsBasicControlValue<NonNullable<Value>> extends true
        ? Value
        : NonNullable<Value> extends TControlObjectValue
          ? {
              [Key in keyof Value]: TControlValue<Value[Key]>;
            }
          : never);
