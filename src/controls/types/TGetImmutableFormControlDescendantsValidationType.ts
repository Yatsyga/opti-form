import { TControlValue } from '../../TControlValue';
import { FormValidationType } from '../../validation';

export type TGetImmutableFormControlDescendantsValidationType<Value> = (
  currentType: FormValidationType,
  value: TControlValue<Value>
) => FormValidationType;
