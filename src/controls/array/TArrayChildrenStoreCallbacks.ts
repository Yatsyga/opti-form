import { TControlUpdateData } from '../../types';
import { TControlArrayValue } from '../../values';

export interface TArrayChildrenStoreCallbacks<Value extends TControlArrayValue> {
  onChildChange: (index: number, changes: TControlUpdateData<Value[number]>) => void;
  onChildDelete: (index: number) => void;
}
