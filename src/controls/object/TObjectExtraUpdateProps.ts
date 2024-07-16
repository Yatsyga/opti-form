import { TControlUpdateData } from '../../types';
import { TControlObjectValue } from '../../values';

export interface TObjectExtraUpdateProps<Value extends TControlObjectValue> {
  childrenUpdates?: {
    [Key in keyof Value]?: TControlUpdateData<Value[Key]>;
  };
}
