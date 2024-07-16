import { TIsBasicControlValue } from '../types';
import { TControlArrayValue, TControlObjectValue } from '../values';
import { ControlArray } from './array';
import { ControlBasic } from './basic/ControlBasic';
import { ControlObject } from './object';

/**
 * Control from "fields" property of return type of useOptiForm
 * Automatically infers control type (basic, object or array) from provided value param
 */
export type TControl<Value> =
  TIsBasicControlValue<Value> extends true
    ? ControlBasic<NonNullable<Value>>
    : NonNullable<Value> extends TControlArrayValue
      ? ControlArray<NonNullable<Value>>
      : NonNullable<Value> extends TControlObjectValue
        ? ControlObject<NonNullable<Value>>
        : ControlBasic<Value>;
