import { TControlValue } from '../../TControlValue';
import { TControlDataBasic } from '../../control-data';
import { TControlNames } from '../../names';
import { TControlUpdateData } from '../../types';
import { FormValidationType, TControlError } from '../../validation';
import { AbstractControl } from '../AbstractControl';
import { TControl } from '../TControl';
import { TControlSetValueExtraProps, TOnControlReady } from '../types';
import { Comparator, Validator } from '../utils';

interface IProps<Value> {
  data: TControlDataBasic<Value, unknown>;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  isTouched: boolean;
  context: unknown;
  validationType: FormValidationType;
  names: TControlNames;
  onReady: TOnControlReady<Value>;
  onChange: (updateData: TControlUpdateData<Value>) => void;
}

interface IState<Value> {
  validator: Validator<Value>;
}

export class ControlBasic<Value> extends AbstractControl<
  Value,
  TControlUpdateData<Value>
> {
  public static create<Value>(props: IProps<Value>): TControl<Value> {
    return new ControlBasic<Value>(props) as TControl<Value>;
  }

  private static modify<Value>(props: IProps<Value>, state: IState<Value>): TControl<Value> {
    return new ControlBasic<Value>(props, state) as TControl<Value>;
  }

  public readonly isDirty: boolean;
  public readonly isValid: boolean;
  public readonly isValidating: boolean;
  public readonly isTouched: boolean;
  public readonly error: TControlError | null;

  protected readonly validator: Validator<Value>;

  private readonly state: IState<Value>;
  private readonly data: TControlDataBasic<Value, unknown>;

  constructor(
    { data, value, defaultValue, isTouched, context, validationType, names, onReady, onChange }: IProps<Value>,
    state?: IState<Value>
  ) {
    super({
      value,
      defaultValue,
      context,
      createDescendantsContext: () => null,
      descendantsContext: null,
      needContextForDescendantsContext: false,
      names,
      validationType,
      onReady,
      onChange,
    });

    this.data = data;

    this.isDirty = this.checkIsDirty();
    this.isTouched = isTouched;
    this.state = this.getState(state, this.data);
    this.validator = this.state.validator;
    this.error = this.state.validator.error;
    this.isValid = this.error === null;
    this.isValidating = this.state.validator.isValidating;
  }

  public setValue(
    newValuePre: TControlValue<Value>,
    extraProps?: TControlSetValueExtraProps
  ): void {
    const newValue: TControlValue<Value> = newValuePre === '' ? undefined : newValuePre;
    const reqExtraProps = this.getRequiredSetValueExtraProps(extraProps);
    const currentValue = this.getCurrentOrPendingValue();

    const updates: Partial<TControlUpdateData<Value>> = {};
    if (currentValue !== newValue) {
      updates.value = newValue;
    }
    if (!this.isTouched && !reqExtraProps.noTouch) {
      updates.isTouched = true;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    this.emitChanges(updates);
  }

  public readonly onTouch = (): void => {
    if (this.isTouched) {
      return;
    }

    this.emitChanges({ isTouched: true });
  };

  protected applyUpdate(comparator: Comparator<Value>): TControl<Value> | null {
    if (comparator.value.isChanged || comparator.defaultValue.isChanged || comparator.shouldRecreate) {
      return this.cloneWithChanges(comparator);
    }

    return null;
  }

  protected destroyState(): void {
    this.state.validator.destroy();
  }

  private cloneWithChanges(comparator: Comparator<Value>): TControl<Value> {
    return ControlBasic.modify<Value>(
      {
        data: this.data,
        value: comparator.value.currentValue,
        defaultValue: comparator.defaultValue.currentValue,
        isTouched: comparator.isTouched.currentValue,
        context: comparator.context.currentValue,
        validationType: comparator.validationType.currentValue,
        names: comparator.names.currentValue,
        onReady: this.onReady,
        onChange: this.onChange,
      },
      this.state
    );
  }

  private getState(
    state: IState<Value> | undefined,
    data: TControlDataBasic<Value, unknown>
  ): IState<Value> {
    if (state) {
      state.validator.onControlInstanceChange(() => this.emitChanges({}));
      return state;
    }

    return {
      validator: new Validator<Value>({
        validate: data.validate,
        validationDebounceMs: data.validationDebounceMs,
        onFinishAsyncValidation: () => this.emitChanges({}),
        initialValues: {
          value: this.value,
          context: this.context,
          isTouched: this.isTouched,
          validationType: this.validationType,
        },
        usesContext: this.data.usesContext,
        noValueError: this.data.noValueError,
      }),
    };
  }

  private getCurrentOrPendingValue(): TControlValue<Value> {
    return this.currentUpdatesData && Object.hasOwn(this.currentUpdatesData, 'value')
      ? this.currentUpdatesData.value!
      : this.value;
  }

  private checkIsDirty(): boolean {
    if (this.value === this.defaultValue) {
      return false;
    }

    if (!this.value && !this.defaultValue && typeof this.value === 'string') {
      return false;
    }

    if (this.value instanceof Date && this.defaultValue instanceof Date) {
      return this.value.getTime() !== this.defaultValue.getTime();
    }

    return true;
  }
}
