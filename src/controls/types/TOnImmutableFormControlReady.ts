import { TControlUpdateData } from '../../types';
import { IImmutableFormControlInternalCallbacks } from './IImmutableFormControlInternalCallbacks';

export type TOnImmutableFormControlReady<Value> = (
  callbacks: IImmutableFormControlInternalCallbacks<Value, TControlUpdateData<Value>>
) => void;
