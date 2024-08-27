import { TControlExternalErrorFlat } from './TControlExternalErrorFlat';
import { TControlValue } from './TControlValue';
import { TFormCreationProps } from './TFormCreationProps';
import { TControlDataFields } from './control-data';
import { FormState } from './form-state';
import { TControlUpdateData, TFormFields, TResetProps } from './types';
import { FormValidationType } from './validation';
import { TControlObjectValue } from './values';

interface IConstantProps<Value extends TControlObjectValue, Context = null> {
  fieldsData: TControlDataFields<Value, Context>;
  onChange?: (newForm: OptiForm<Value, Context>) => void;
}

interface IProps<Value extends TControlObjectValue, Context = null> {
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  context: Context;
  validationType: FormValidationType;
}

interface IUpdateData<Value extends TControlObjectValue> {
  internal?: TControlUpdateData<Value>;
  external?: TControlUpdateData<Value>;
}

export class OptiForm<Value extends TControlObjectValue, Context = null> {
  public static create<Value extends TControlObjectValue, Context>(
    props: TFormCreationProps<Value, Context>,
  ): OptiForm<Value, Context> {
    return new OptiForm(
      {
        fieldsData: props.fieldsData,
      },
      {
        value: props.value,
        defaultValue: props.defaultValue,
        context: props.context,
        validationType: props.validationType,
      },
    );
  }

  private static modify<Value extends TControlObjectValue, Context>(
    constantProps: IConstantProps<Value, Context>,
    state: FormState<Value, Context>,
  ): OptiForm<Value, Context> {
    return new OptiForm(constantProps, state);
  }

  public get fields(): TFormFields<Value> {
    return this.state.rootControl.fields;
  }

  public get value(): TControlValue<Value> {
    return this.state.rootControl.value;
  }

  public get defaultValue(): TControlValue<Value> {
    return this.state.rootControl.defaultValue;
  }

  public get isTouched(): boolean {
    return this.state.rootControl.isTouched;
  }

  public get isDirty(): boolean {
    return this.state.rootControl.isDirty;
  }

  public get isValid(): boolean {
    return this.state.rootControl.isValid;
  }

  public get isValidating(): boolean {
    return this.state.rootControl.isValidating;
  }

  private state: FormState<Value, Context>;
  private updateData?: IUpdateData<Value>;

  constructor(
    private readonly constantProps: IConstantProps<Value, Context>,
    arg: IProps<Value, Context> | FormState<Value, Context>,
  ) {
    this.state = this.getState(arg);
  }

  public setValue(value: TControlValue<Value>): void {
    this.state.rootControl.setValue(value);
  }

  public reset(props?: TResetProps<Value>): void {
    const newValue =
      props && Object.hasOwn(props, 'value') ? props.value : this.defaultValue;
    this.state.rootControl.setValue(newValue, { noTouch: true });

    if (!props?.keepIsTouched) {
      this.modifyExternalUpdate({ isTouched: false });
    }

    if (
      props &&
      (Object.hasOwn(props, 'value') || Object.hasOwn(props, 'defaultValue'))
    ) {
      this.modifyExternalUpdate({
        defaultValue: Object.hasOwn(props, 'defaultValue')
          ? props.defaultValue
          : newValue,
      });
    }
  }

  public setValidationType(newType: FormValidationType): void {
    this.modifyExternalUpdate({ validationType: newType });
  }

  public setContext(context: Context): void {
    this.modifyExternalUpdate({ context });
  }

  public setOnChange(
    callback: (newForm: OptiForm<Value, Context>) => void,
  ): void {
    this.constantProps.onChange = callback;
  }

  public getValidValue(): Promise<Value | null> {
    if (this.state.validationType !== FormValidationType.always) {
      this.modifyExternalUpdate({ validationType: FormValidationType.always });
    }

    if (!this.updateData && !this.isValidating) {
      return Promise.resolve(this.isValid ? (this.value as Value) : null);
    }

    return this.state.waitForValidValue();
  }

  public applyFlatErrorsList(flatErrors: TControlExternalErrorFlat[]): void {
    const customErrors =
      this.state.customErrorsHandler.getCustomErrorsFromFlatList(flatErrors);
    if (customErrors.length > 0) {
      this.onChange({ customErrors }, 'external');
    }
  }

  public destroy(): void {
    this.updateData = undefined;
    this.state.destroy();
  }

  private getState(
    arg: IProps<Value, Context> | FormState<Value, Context>,
  ): FormState<Value, Context> {
    const onChange = (updateData: TControlUpdateData<Value>) => {
      return this.onChange(updateData, 'internal');
    };

    if (arg instanceof FormState) {
      arg.onInstanceChange(onChange);
      return arg;
    }

    return new FormState({
      fieldsData: this.constantProps.fieldsData,
      value: arg.value,
      defaultValue: arg.defaultValue,
      validationType: arg.validationType,
      context: arg.context,
      onChange,
    });
  }

  private onChange(
    updateData: TControlUpdateData<Value>,
    key: keyof IUpdateData<Value>,
  ): void {
    const shouldStartCountdown = this.updateData === undefined;
    if (!this.updateData) {
      this.updateData = {};
    }
    this.updateData[key] = updateData;

    if (!shouldStartCountdown) {
      return;
    }

    setTimeout(() => {
      if (!this.updateData) {
        return;
      }

      const finalUpdate: TControlUpdateData<Value> = Object.assign(
        {},
        this.updateData.internal,
        this.updateData.external,
      );

      const needUpdate = this.state.applyUpdate(finalUpdate);
      if (!needUpdate) {
        this.updateData = undefined;
        return;
      }

      this.constantProps.onChange?.(
        OptiForm.modify(this.constantProps, this.state),
      );
    }, 0);
  }

  private modifyExternalUpdate(updateData: TControlUpdateData<Value>): void {
    const externalUpdate: TControlUpdateData<Value> = Object.assign(
      this.updateData?.external ?? {},
      updateData,
    );
    this.onChange(externalUpdate, 'external');
  }
}
