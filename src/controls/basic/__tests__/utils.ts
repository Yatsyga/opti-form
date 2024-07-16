import { TControlValue } from '../../../TControlValue';
import {
    TControlData,
    TControlDataBasic,
    createBasic,
} from '../../../control-data';
import { TControlNames } from '../../../names';
import { TControlUpdateData } from '../../../types';
import { FormValidationType } from '../../../validation';
import { TControl } from '../../TControl';
import { createControl } from '../../createControl';
import { IImmutableFormControlInternalCallbacks } from '../../types';

export function createTestControl<Value, Context = unknown>(props: {
  data: TControlDataBasic<Value, Context>;
  value?: TControlValue<Value>;
  defaultValue?: TControlValue<Value>;
  context?: Context;
  validationType?: FormValidationType;
  isTouched?: boolean;
  names?: TControlNames;
  onChange?: (updateData: TControlUpdateData<Value>) => void;
}): [
  TControl<Value>,
  IImmutableFormControlInternalCallbacks<Value, TControlUpdateData<Value>>,
] {
  let callbacks = {} as IImmutableFormControlInternalCallbacks<Value, TControlUpdateData<Value>>;

  const control = createControl<Value, Context>({
    data: props.data as TControlData<Value, unknown>,
    context: props.context ?? (null as Context),
    defaultValue: props.defaultValue,
    value: props.value,
    names: props.names ?? { dynamic: 'dynamic', static: 'static' },
    isTouched: props.isTouched ?? false,
    onChange: props.onChange ?? (() => {}),
    onReady: (createdCallbacks) => {
      Object.assign(callbacks, createdCallbacks);
    },
    validationType: props.validationType ?? FormValidationType.always,
  });

  return [control, callbacks!];
}

test('Creation does not throw error', () => {
  expect(() =>
    createTestControl({
      context: null,
      data: createBasic<number | undefined>({}),
      defaultValue: 2,
      value: 2,
      onChange: () => {},
      validationType: FormValidationType.always,
    })
  ).not.toThrow();
});
