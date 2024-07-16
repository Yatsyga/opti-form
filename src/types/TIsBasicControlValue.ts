import { TControlBasicValue } from '../values';

export type TIsBasicControlValue<T> = T extends TControlBasicValue ? true : false;
