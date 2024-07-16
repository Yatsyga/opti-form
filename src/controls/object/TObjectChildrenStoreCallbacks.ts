import { TControlNames } from '../../names';
import { TControlUpdateData } from '../../types';
import { TControlObjectValue } from '../../values';

export interface TObjectChildrenStoreCallbacks<Value extends TControlObjectValue> {
  onChildChange: <Key extends keyof Value & string>(
    key: Key,
    changes: TControlUpdateData<Value[Key]>
  ) => void;
  createChildNames: (names: TControlNames, key: keyof Value & string) => TControlNames;
}
