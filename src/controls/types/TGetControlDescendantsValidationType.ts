import { TControlValue } from '../../TControlValue';
import { FormValidationType } from '../../validation';

export type TGetControlDescendantsValidationType<Value> = (
  currentType: FormValidationType,
  value: TControlValue<Value>
) => FormValidationType;
