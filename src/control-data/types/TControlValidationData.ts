import { TControlError, TValidateControl } from '../../validation';

export type TControlValidationData<Value, Context> = TNullToOptionalUndefined<{
  noValueError: undefined extends Value ? null : TControlError;
}> &
  (
    | {
        validationDebounceMs?: number;
        usesContext: true;
        validate: TValidateControl<Value, Context>;
      }
    | {
        usesContext?: false;
        validate?: TValidateControl<Value, never>;
        validationDebounceMs?: number;
      }
  );

type TNullKeys<T extends { [key: string]: any }> = {
  [Key in keyof T]: T[Key] extends null ? Key : never;
}[keyof T];

type TNullToOptionalUndefined<T extends { [key: string]: any }> = Omit<T, TNullKeys<T>> & {
  [Key in TNullKeys<T>]?: undefined;
};
