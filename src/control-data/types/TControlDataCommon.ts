import { TControlError, TValidateControl } from '../../validation';

export interface TControlDataCommon<Value, Context = null> {
  validate: TValidateControl<Value, Context>;
  validationDebounceMs: number;
  usesContext: boolean;
  descendantsUsePassedContext: boolean;
  noValueError: TControlError | null;

  // These properties are not used or set anywhere.
  // They are needed here only for typescript to correctly infer types
  _value?: Value;
  _context?: Context;
}
