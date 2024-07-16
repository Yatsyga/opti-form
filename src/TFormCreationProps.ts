import { TControlValue } from './TControlValue';
import { TControlDataFields } from './control-data';
import { FormValidationType } from './validation';
import { TControlObjectValue } from './values';

export interface TFormCreationProps<Value extends TControlObjectValue, Context> {
  fieldsData: TControlDataFields<Value, Context>;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  validationType: FormValidationType;
  context: Context;
}
