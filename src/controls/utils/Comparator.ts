import { TControlValue } from '../../TControlValue';
import { TControlNames } from '../../names';
import { TControlCustomError, TControlUpdateData } from '../../types';
import { FormValidationType, TControlError } from '../../validation';
import { TGetImmutableFormControlDescendantsValidationType } from '../types';
import { Validator } from './Validator';

interface IPropData<T> {
  currentValue: T;
  isChanged: boolean;
  oldValue: T;
}

interface IProps<Value> {
  data: TControlUpdateData<Value>;
  oldProps: IOldProps<Value>;
  validator: Validator<Value>;
  needContextForDescendantsContext: boolean;
  createDescendantsContext: (value: TControlValue<Value>, context: unknown) => unknown;
}

interface IOldProps<Value> {
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  context: unknown;
  descendantsContext: unknown;
  isTouched: boolean;
  names: TControlNames;
  validationType: FormValidationType;
  childValidationType: FormValidationType;
}

export class Comparator<Value> {
  public readonly value: IPropData<TControlValue<Value>>;
  public readonly defaultValue: IPropData<TControlValue<Value>>;
  public readonly context: IPropData<unknown>;
  public readonly descendantsContext: IPropData<unknown>;
  public readonly error: IPropData<TControlError | null>;
  public readonly isValidating: IPropData<boolean>;
  public readonly isTouched: IPropData<boolean>;
  public readonly names: IPropData<TControlNames>;
  public readonly validationType: IPropData<FormValidationType>;
  public readonly childValidationType: IPropData<FormValidationType>;
  public readonly shouldRecreate: boolean;
  public readonly shouldEnrichDescendantsContext: boolean;
  public readonly customErrors: TControlCustomError[];

  constructor(
    private readonly props: IProps<Value>,
    getDescendantsValidationType: TGetImmutableFormControlDescendantsValidationType<Value>
  ) {
    this.value = this.createPropData('value');
    this.defaultValue = this.createPropData('defaultValue');
    this.context = this.createPropData('context');
    this.descendantsContext = this.createDescendantsContextData();
    this.isTouched = this.createPropData('isTouched');
    this.names = this.createPropData(
      'names',
      (value1, value2) => value1?.dynamic === value2?.dynamic && value1?.static === value2?.static
    );
    this.validationType = this.createPropData('validationType');
    this.childValidationType = this.createChildValidationTypeData(getDescendantsValidationType);

    if (this.props.needContextForDescendantsContext === undefined) {
      throw new Error('bazinga');
    }

    const { error, isValidating } = this.createErrorAndIsValidatingData();
    this.error = error;
    this.isValidating = isValidating;

    this.shouldRecreate =
      this.isTouched.isChanged ||
      this.names.isChanged ||
      this.error.isChanged ||
      this.isValidating.isChanged ||
      this.props.validator.needUpdate;

    this.shouldEnrichDescendantsContext =
      this.defaultValue.isChanged ||
      this.descendantsContext.isChanged ||
      (this.isTouched.isChanged && this.isTouched.currentValue === false) ||
      this.names.isChanged ||
      this.childValidationType.isChanged;

    this.customErrors = this.props.data.customErrors ?? [];
  }

  public getEnrichedDescendantsUpdate<DescendantValue>(props: {
    initialUpdate: TControlUpdateData<DescendantValue>;
    forceEnrich?: boolean;
    customErrors?: TControlCustomError[];
    getDefaultValue: (
      value: TControlValue<Value>
    ) => TControlValue<DescendantValue>;
    getNames: () => TControlNames;
  }): TControlUpdateData<DescendantValue> {
    const result: TControlUpdateData<DescendantValue> = {};

    Object.assign(
      result,
      props.initialUpdate,
      props.forceEnrich || this.defaultValue.isChanged
        ? {
            defaultValue: this.defaultValue.currentValue
              ? props.getDefaultValue(this.defaultValue.currentValue!)
              : undefined,
          }
        : undefined,
      props.forceEnrich || this.descendantsContext.isChanged
        ? { context: this.descendantsContext.currentValue }
        : undefined,
      props.customErrors?.length && { customErrors: props.customErrors },
      this.isTouched.isChanged && this.isTouched.currentValue === false ? { isTouched: false } : undefined,
      this.childValidationType.isChanged ? { validationType: this.childValidationType.currentValue } : undefined,
      props.forceEnrich || this.names.isChanged ? { names: props.getNames() } : undefined
    );

    return result;
  }

  private createPropData<Key extends keyof TControlUpdateData<Value> & keyof IOldProps<Value>>(
    key: Key,
    compareValues: (
      value1: TControlUpdateData<Value>[Key],
      value2: TControlUpdateData<Value>[Key]
    ) => boolean = (value1, value2) => value1 === value2
  ): IPropData<NonNullable<TControlUpdateData<Value>[Key]>> {
    const oldValue = this.props.oldProps[key] as NonNullable<TControlUpdateData<Value>[Key]>;
    if (!Object.hasOwn(this.props.data, key)) {
      return {
        currentValue: oldValue,
        oldValue,
        isChanged: false,
      };
    }

    return {
      currentValue: this.props.data[key] as NonNullable<TControlUpdateData<Value>[Key]>,
      isChanged: !compareValues(
        this.props.data[key],
        this.props.oldProps[key] as TControlUpdateData<Value>[Key]
      ),
      oldValue,
    };
  }

  private createDescendantsContextData(): IPropData<unknown> {
    const oldValue = this.props.oldProps.descendantsContext;
    if (!this.value.isChanged && (!this.props.needContextForDescendantsContext || !this.context.isChanged)) {
      return { currentValue: oldValue, oldValue, isChanged: false };
    }

    const newDescendantsContext = this.props.createDescendantsContext(
      this.value.currentValue,
      this.context.currentValue
    );
    return { currentValue: newDescendantsContext, isChanged: newDescendantsContext !== oldValue, oldValue };
  }

  private createChildValidationTypeData(
    getDescendantsValidationType: TGetImmutableFormControlDescendantsValidationType<Value>
  ): IPropData<FormValidationType> {
    const newValidationType = getDescendantsValidationType(this.validationType.currentValue, this.value.currentValue);
    const oldValue = this.props.oldProps.childValidationType;
    return { currentValue: newValidationType, oldValue, isChanged: newValidationType !== oldValue };
  }

  private createErrorAndIsValidatingData(): {
    error: IPropData<TControlError | null>;
    isValidating: IPropData<boolean>;
  } {
    const customError = this.props.data.customErrors?.find(({ path }) => path.length === 0)?.error;

    if (!customError && !this.checkNeedNewValidation()) {
      return {
        error: { currentValue: this.props.validator.error, oldValue: this.props.validator.error, isChanged: false },
        isValidating: {
          currentValue: this.props.validator.isValidating,
          oldValue: this.props.validator.isValidating,
          isChanged: false,
        },
      };
    }

    const oldError = this.props.validator.error;
    const oldIsValidating = this.props.validator.isValidating;

    this.props.validator.onChange({
      value: this.value.currentValue,
      context: this.context.currentValue,
      isTouched: this.isTouched.currentValue,
      validationType: this.validationType.currentValue,
      customError,
    });

    return {
      error: {
        currentValue: this.props.validator.error,
        oldValue: oldError,
        isChanged: !this.checkErrorsEqual(oldError, this.props.validator.error),
      },
      isValidating: {
        currentValue: this.props.validator.isValidating,
        oldValue: oldIsValidating,
        isChanged: this.props.validator.isValidating !== oldIsValidating,
      },
    };
  }

  private checkNeedNewValidation(): boolean {
    const baseCheck = this.value.isChanged || this.context.isChanged;

    const oldNeedValidation = Validator.checkShouldValidate(
      this.validationType.oldValue,
      this.isTouched.oldValue
    );
    const newNeedValidation = Validator.checkShouldValidate(
      this.validationType.currentValue,
      this.isTouched.currentValue
    );
    if (oldNeedValidation === newNeedValidation) {
      return newNeedValidation ? baseCheck : false;
    }

    return true;
  }

  private checkErrorsEqual(
    error1: TControlError | null,
    error2: TControlError | null
  ): boolean {
    if (!error1 && !error2) {
      return true;
    }

    if (!error1 || !error2) {
      return false;
    }

    return error1.message === error2.message;
  }
}
