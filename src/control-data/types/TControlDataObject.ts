import { ControlType } from '../../ControlType';
import { TControlObjectValue } from '../../values';
import { TControlDataCommon } from './TControlDataCommon';
import { TControlDataFields } from './TControlDataFields';
import { TCreateDescendantsContext } from './TCreateDescendantsContext';

export interface TControlDataObject<Value extends TControlObjectValue, Context>
  extends TControlDataCommon<Value, Context> {
  type: ControlType.object;
  createDescendantsContext: TCreateDescendantsContext<Value, Context, unknown>;
  needContextForDescendantsContext: boolean;
  fieldsData: TControlDataFields<Value, unknown>;
}
