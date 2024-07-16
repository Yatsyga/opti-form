import { ControlType } from '../../ControlType';
import { TControlArrayValue } from '../../values';
import { TControlData } from './TControlData';
import { TControlDataCommon } from './TControlDataCommon';
import { TCreateDescendantsContext } from './TCreateDescendantsContext';

export interface TControlDataArray<Value extends TControlArrayValue, Context>
  extends TControlDataCommon<Value, Context> {
  type: ControlType.array;
  createDescendantsContext: TCreateDescendantsContext<Value, Context, unknown>;
  needContextForDescendantsContext: boolean;
  childData: TControlData<Value[number], unknown>;
}
