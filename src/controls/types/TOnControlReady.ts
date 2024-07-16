import { TControlUpdateData } from '../../types';
import { TControlInternalCallbacks } from './TControlInternalCallbacks';

export type TOnControlReady<Value> = (
  callbacks: TControlInternalCallbacks<Value, TControlUpdateData<Value>>
) => void;
