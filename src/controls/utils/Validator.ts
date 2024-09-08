import { TControlValue } from '../../TControlValue';
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
  public static checkShouldValidate(
    validationType: FormValidationType,
    isTouched: boolean,
  ): boolean {
    switch (validationType) {
      case FormValidationType.always:
        return true;
      case FormValidationType.never:
        return false;
      case FormValidationType.onlyTouched:
        return isTouched;
    }
  }

  public get error(): TControlError | null {
    return this.isErrorVisible ? this.currentError : null;
  }

  public get isValidating(): boolean {
    return this.isErrorVisible ? this.internalIsValidating : false;
  }

  public needUpdate: boolean = false;

  private readonly validationCallback: TValidateControl<Value, unknown>;
  private readonly validationDebounceMs: number;
  private readonly usesContext: boolean;
  private readonly noValueError: TControlError | null;

  private cancelAsyncValidation: () => void = () => {};
  private onFinishAsyncValidation: () => void;
  private cache?: ICache<Value>;
  private currentError: TControlError | null = null;
  private isErrorVisible: boolean = false;
  private internalIsValidating: boolean = false;

  constructor({
    validate,
    validationDebounceMs,
    onFinishAsyncValidation,
    initialValues,
    usesContext,
    noValueError,
  }: IProps<Value>) {
    this.validationCallback = validate;
    this.validationDebounceMs = validationDebounceMs;
    this.onFinishAsyncValidation = onFinishAsyncValidation;
    this.usesContext = usesContext;
    this.noValueError = noValueError;

    this.onChange(initialValues);
  }

  public onChange(props: IOnChangeProps<Value>): void {
    this.cancelAsyncValidation();
    this.isErrorVisible = Validator.checkShouldValidate(
      props.validationType,
      props.isTouched,
    );

    if (props.customError) {
      this.currentError = props.customError;
      this.internalIsValidating = false;
      return;
    }

    if (!this.isErrorVisible) {
      if (this.error) {
        this.currentError = null;
        this.internalIsValidating = false;
      }
      return;
    }

    if (props.value === undefined && this.noValueError) {
      this.currentError = this.noValueError;
      this.internalIsValidating = false;
      return;
    }

    if (!this.validationDebounceMs || props.value === undefined) {
      this.validate(props, false);
      return;
    }

    this.internalIsValidating = true;
    this.currentError = null;
    const timer = setTimeout(
      () => this.validate(props, true),
      this.validationDebounceMs,
    );
    this.cancelAsyncValidation = () => clearTimeout(timer);
  }

  public onControlInstanceChange(callback: () => void): void {
    this.needUpdate = false;
    this.onFinishAsyncValidation = callback;
  }

  public async checkIsValid(
    value: TControlValue<Value>,
    context: unknown,
  ): Promise<boolean> {
    const validationResult = await this.getValidationResult(value, context);
    return validationResult === null;
  }

  public destroy(): void {
    this.cancelAsyncValidation();
    this.cache = undefined;
    this.onFinishAsyncValidation = () => {};
  }

  private validate(
    props: IOnChangeProps<Value>,
    shouldCallFinishAsyncValidation: boolean,
  ): void {
    const newValidationResult = this.getValidationResult(
      props.value,
      props.context,
    );

    if (newValidationResult instanceof Promise) {
      this.handleAsyncValidation(newValidationResult);
      return;
    }

    const changed = this.error !== newValidationResult;

    this.internalIsValidating = false;
    this.currentError = newValidationResult;
    if (changed && shouldCallFinishAsyncValidation) {
      this.needUpdate = true;
      this.onFinishAsyncValidation();
    }
  }

  private getValidationResult(
    value: TControlValue<Value>,
    contextPre: unknown,
  ): TControlValidationResult {
    if (value === undefined && this.noValueError) {
      return this.noValueError;
    }

    const context = this.usesContext ? contextPre : null;
    if (
      this.cache &&
      this.cache.value === value &&
      this.cache.context === context
    ) {
      return this.cache.result;
    }

    const result = this.validationCallback(value, context);
    this.cache = { value, context, result };

    return result;
  }

  private handleAsyncValidation(promise: Promise<TControlError | null>): void {
    this.internalIsValidating = true;
    let onFinishValidating = (error: TControlError | null) => {
      this.currentError = error;
      this.needUpdate = true;
      this.internalIsValidating = false;
      this.onFinishAsyncValidation();
    };

    this.cancelAsyncValidation = () => {
      onFinishValidating = () => {};
    };

    promise.then((result) => onFinishValidating(result));
  }
}
