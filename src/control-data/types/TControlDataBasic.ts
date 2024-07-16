import { ControlType } from '../../ControlType';
import { TControlDataCommon } from './TControlDataCommon';

export type TControlDataBasic<Value, Context> = TControlDataCommon<Value, Context> & {
  type: ControlType.basic;
};
