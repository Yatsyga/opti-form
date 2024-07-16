import { TControlError } from './validation';

export interface TControlExternalErrorFlat {
  path: string;
  error: TControlError;
}
