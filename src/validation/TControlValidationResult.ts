import { TControlError } from './TControlError';

export type TControlValidationResult =
  | TControlError
  | null
  | Promise<TControlError | null>;
