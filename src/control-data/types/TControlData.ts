import { TIsBasicControlValue } from '../../types';
import { TControlArrayValue, TControlObjectValue } from '../../values';
import { TControlDataArray } from './TControlDataArray';
import { TControlDataBasic } from './TControlDataBasic';
import { TControlDataObject } from './TControlDataObject';

export type TControlData<Value, Context> =
  NonNullable<Value> extends TControlArrayValue
    ? TControlDataArray<NonNullable<Value>, Context>
    : TIsBasicControlValue<Value> extends true
      ? TControlDataBasic<Value, Context>
      : Value extends TControlObjectValue | undefined
        ? TControlDataObject<Value, Context>
        : never;
