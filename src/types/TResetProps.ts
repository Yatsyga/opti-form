import { TControlObjectValue } from '../values';

export interface TResetProps<Value extends TControlObjectValue> {
  /**
   * New value for entire form. By default equals current default value
   */
  value?: Value;
  /**
   * New default value for entire form. By default equals provided value
   */
  defaultValue?: Value;
  /**
   * Wether or not controls should keep isTouched state after reset. By default equals false
   */
  keepIsTouched?: boolean;
}
