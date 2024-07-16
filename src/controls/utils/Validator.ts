import { TControlValue } from '../../TControlValue';
import { TControlCustomError } from '../../types';
import {
  FormValidationType,
  TControlError,
  TControlValidationResult,
  TValidateControl,
} from '../../validation';

interface IProps<Value> {
  validate: TValidateControl<Value, unknown>;
  validationDebounceMs: number;
  onFinishAsyncValidation: () => void;
  initialValues: IStoredValues<Value>;
  usesContext: boolean;
  noValueError: TControlError | null;
}

interface IStoredValues<Value> {
  value: TControlValue<Value>;
  context: unknown;
  isTouched: boolean;
  validationType: FormValidationType;
}

type IOnChangeProps<Value> = IStoredValues<Value> & {
  customError?: TControlError;
};

interface ICache<Value> {
  value: TControlValue<Value>;
  context: unknown;
  result: TControlValidationResult;
}

export class Validator<Value> {
  public static checkShouldValidate(validationType: FormValidationType, isTouched: boolean): boolean {
    switch (validationType) {
      case FormValidationType.always:
        return true;
      case FormValidationType.never:
        return false;
      case FormValidationType.onlyTouched:
        return isTouched;
    }
  }

  public error: TControlError | null = null;
  public isValidating: boolean = false;
  public needUpdate: boolean = false;

  private readonly validate: TValidateControl<Value, unknown>;
  private readonly validationDebounceMs: number;
  private readonly usesContext: boolean;
  private readonly noValueError: TControlError | null;

  private cancelAsyncValidation: () => void = () => {};
  private onFinishAsyncValidation: () => void;
  private cache?: ICache<Value>;

  constructor({
    validate,
    validationDebounceMs,
    onFinishAsyncValidation,
    initialValues,
    usesContext,
    noValueError,
  }: IProps<Value>) {
    this.validate = validate;
    this.validationDebounceMs = validationDebounceMs;
    this.onFinishAsyncValidation = onFinishAsyncValidation;
    this.usesContext = usesContext;
    this.noValueError = noValueError;

    this.onChange(initialValues);
  }

  public onChange(props: IOnChangeProps<Value>): void {
    this.cancelAsyncValidation();

    if (props.customError) {
      this.error = props.customError;
      this.isValidating = false;
      return;
    }

    if (!Validator.checkShouldValidate(props.validationType, props.isTouched)) {
      if (this.error) {
        this.error = null;
        this.isValidating = false;
      }
      return;
    }

    if (props.value === undefined && this.noValueError) {
      this.error = this.noValueError;
      this.isValidating = false;
      return;
    }

    if (!this.validationDebounceMs || props.value === undefined) {
      this.syncInternalValidate(props, false);
      return;
    }

    this.isValidating = true;
    this.error = null;
    const timer = setTimeout(() => this.syncInternalValidate(props, true), this.validationDebounceMs);
    this.cancelAsyncValidation = () => clearTimeout(timer);
  }

  public onControlInstanceChange(callback: () => void): void {
    this.needUpdate = false;
    this.onFinishAsyncValidation = callback;
  }

  public setCustomErrors(errors: TControlCustomError[]): void {}

  public destroy(): void {
    this.cancelAsyncValidation();
    this.cache = undefined;
    this.onFinishAsyncValidation = () => {};
  }

  private syncInternalValidate(props: IOnChangeProps<Value>, shouldCallFinishAsyncValidation: boolean): void {
    const newValidationResult = this.internalValidate(props);

    if (newValidationResult instanceof Promise) {
      this.handleAsyncValidation(newValidationResult);
      return;
    }

    const changed = this.error !== newValidationResult;

    this.isValidating = false;
    this.error = newValidationResult;
    if (changed && shouldCallFinishAsyncValidation) {
      this.needUpdate = true;
      this.onFinishAsyncValidation();
    }
  }

  private internalValidate(props: IOnChangeProps<Value>): TControlValidationResult {
    const context = this.usesContext ? props.context : null;
    if (this.cache && this.cache.value === props.value && this.cache.context === context) {
      return this.cache.result;
    }

    const result = this.validate(props.value, context);
    this.cache = { value: props.value, context, result };

    return result;
  }

  private handleAsyncValidation(promise: Promise<TControlError | null>): void {
    this.isValidating = true;
    let onFinishValidating = (error: TControlError | null) => {
      this.error = error;
      this.needUpdate = true;
      this.isValidating = false;
      this.onFinishAsyncValidation();
    };

    this.cancelAsyncValidation = () => {
      onFinishValidating = () => {};
    };

    promise.then((result) => onFinishValidating(result));
  }
}
