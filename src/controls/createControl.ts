import { ControlType } from '../ControlType';
import { TControlValue } from '../TControlValue';
import {
    TControlData,
    TControlDataArray,
    TControlDataObject,
} from '../control-data';
import { TControlNames, createObjectChildNames } from '../names';
import { TControlUpdateData } from '../types';
import { FormValidationType } from '../validation';
import { TControlArrayValue, TControlObjectValue } from '../values';
import { TControl } from './TControl';
import { ControlArray } from './array';
import { ControlBasic } from './basic';
import { ControlObject } from './object';
import { TOnControlReady } from './types';

interface IProps<Value, Context = unknown> {
  data: TControlData<Value, unknown>;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  context: Context;
  validationType: FormValidationType;
  isTouched: boolean;
  names: TControlNames;
  onReady: TOnControlReady<Value>;
  onChange: (updateData: TControlUpdateData<Value>) => void;
}

export function createControl<Value, Context = unknown>({
  data,
  value,
  defaultValue,
  context,
  validationType,
  isTouched,
  names,
  onReady,
  onChange,
}: IProps<Value, Context>): TControl<Value> {
  switch (data.type) {
    case ControlType.basic:
      return ControlBasic.create<Value>({
        data,
        isTouched,
        value,
        defaultValue,
        names,
        context,
        validationType,
        onReady,
        onChange,
      });
    case ControlType.object:
      return ControlObject.create<TControlObjectValue>({
        data: data as TControlDataObject<TControlObjectValue, unknown>,
        value: value as TControlValue<TControlObjectValue>,
        defaultValue: defaultValue as TControlValue<TControlObjectValue>,
        isTouched,
        context,
        validationType,
        names,
        onReady: onReady as TOnControlReady<TControlObjectValue>,
        onChange: onChange as (updateData: TControlUpdateData<TControlObjectValue>) => void,
        createChildNames: (names, key) => createObjectChildNames(names, key),
      }) as unknown as TControl<Value>;
    case ControlType.array:
      return ControlArray.create<TControlArrayValue>({
        data: data as unknown as TControlDataArray<TControlArrayValue, unknown>,
        value: value as TControlValue<TControlArrayValue>,
        defaultValue: defaultValue as TControlValue<TControlArrayValue>,
        isTouched,
        context,
        validationType,
        names,
        onReady: onReady as unknown as TOnControlReady<TControlArrayValue>,
        onChange: onChange as (updateData: TControlUpdateData<TControlArrayValue>) => void,
      }) as unknown as TControl<Value>;
    default:
      throw new Error('not implemented');
  }
}
