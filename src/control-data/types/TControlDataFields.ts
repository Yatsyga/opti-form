import { TControlObjectValue } from '../../values';
import { TControlData } from './TControlData';

export type TControlDataFields<Value extends TControlObjectValue, Context = null> = {
  [Key in keyof Required<NonNullable<Value>>]: TControlData<TProp<Value, Key>, Context>;
};

type TProp<
  Value extends TControlObjectValue,
  Key extends keyof Required<NonNullable<Value>>,
> = NonNullable<Value>[Key];
