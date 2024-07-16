import { TControl } from '../TControl';

export interface TControlInternalCallbacks<Value, DataFull extends Record<string, any>> {
  applyUpdate: (internalUpdate: DataFull) => TControl<Value> | null;
  clearUpdate: () => void;
  destroy: () => void;
}
