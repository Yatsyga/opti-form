import { TControlError, TValidateControl } from '../../validation';

export type TControlValidationData<Value, Context> = TNullToOptionalUndefined<{
  /**
   * Provide default error here that will be set if value is not defined
   */
  noValueError: undefined extends Value ? null : TControlError;
}> &
  (
    | {
        /**
         * If provided, then validation will be debounced. Useful if you don't want to run validation for each letter the user types
         */
        validationDebounceMs?: number;
        /**
         * If true, then validation context will be provided to validate callback
         */
        usesContext: true;
        /**
         * Validation callback for control. If noValue error is provided, this callback will be called only if value is defined.
         * @param value control value
         * @param context since usesContext === true, this callback will receive validation context as second argument.
         */
        validate: TValidateControl<Value, Context>;
      }
    | {
        /**
         * If provided, then validation will be debounced. Useful if you don't want to run validation for each letter the user types
         */
        validationDebounceMs?: number;
        /**
         * If true, then validation context will be provided to validate callback
         */
        usesContext?: false;
        /**
         * Validation callback for control. If noValue error is provided, this callback will be called only if value is defined.
         * @param value control value
         * Since usesContext === false | undefined, this callback will not receive validation context as second argument.
         */
        validate?: TValidateControl<Value, never>;
      }
  );

type TNullKeys<T extends { [key: string]: any }> = {
  [Key in keyof T]: T[Key] extends null ? Key : never;
}[keyof T];

type TNullToOptionalUndefined<T extends { [key: string]: any }> = Omit<T, TNullKeys<T>> & {
  [Key in TNullKeys<T>]?: undefined;
};
