import { TControlUpdateData } from '../../types';
import { TControlArrayValue } from '../../values';

export interface TArrayExtraUpdateProps<Value extends TControlArrayValue> {
  childrenUpdates?: {
    changed?: Map<number, TControlUpdateData<Value[number]>>;
    deleted?: Set<number>;
    added?: Map<number, IInsertedItems<Value[number]>>;
  };
}

interface IInsertedItems<Value> {
  before: Value[];
  after: Value[];
}
