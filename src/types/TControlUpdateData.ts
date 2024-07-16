import { TControlValue } from '../TControlValue';
import { TControlNames } from '../names';
import { FormValidationType } from '../validation';
import { TControlCustomError } from './TControlCustomError';

export type TControlUpdateData<Value> = {
  value?: TControlValue<Value>;
  defaultValue?: TControlValue<Value>;
  context?: unknown;
  isTouched?: boolean;
  validationType?: FormValidationType;
  names?: TControlNames;
  customErrors?: TControlCustomError[];
} & {
  [key: string]: unknown;
};
