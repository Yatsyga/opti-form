import { TControl } from '../controls';
import { TControlObjectValue } from '../values';

export type TFormFields<Value extends TControlObjectValue> = {
  [Key in keyof Value]-?: TControl<Value[Key]>;
};
