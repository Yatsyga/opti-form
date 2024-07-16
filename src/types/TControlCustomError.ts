import { TControlError } from '../validation';

export interface TControlCustomError {
  path: string[];
  error: TControlError;
}
