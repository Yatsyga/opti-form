import { TIsBasicControlValue } from './types';
import { TControlArrayValue, TControlObjectValue } from './values';

/**
 * This is value for each control. It can be undefined.
 * If it is array or object, then each descendant can also be undefined
 */
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
