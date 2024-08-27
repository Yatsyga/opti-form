import { TControlValue } from '../../TControlValue';
import { TControlDataObject } from '../../control-data';
import { TControlNames } from '../../names';
import { TControlUpdateData, TFormFields } from '../../types';
import { FormValidationType, TControlError } from '../../validation';
import { TControlObjectValue } from '../../values';
import { AbstractControl } from '../AbstractControl';
import { TControl } from '../TControl';
import {
  TControlSetValueExtraProps,
  TGetControlDescendantsValidationType,
  TOnControlReady,
} from '../types';
import { Comparator, Validator } from '../utils';
import { TObjectChildrenStoreCallbacks } from './TObjectChildrenStoreCallbacks';
import { TObjectExtraUpdateProps } from './TObjectExtraUpdateProps';
import { ObjectChildrenStore } from './utils';

interface IProps<Value extends TControlObjectValue> {
  data: TControlDataObject<Value, unknown>;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  isTouched: boolean;
  context: unknown;
  validationType: FormValidationType;
  names: TControlNames;
  onReady: TOnControlReady<Value>;
  onChange: (updateData: TControlUpdateData<Value>) => void;
  createChildNames: (
    names: TControlNames,
    key: keyof Value & string,
  ) => TControlNames;
}

interface IState<Value extends TControlObjectValue> {
  validator: Validator<Value>;
  childrenStore: ObjectChildrenStore<Value, unknown>;
  descendantsContext: unknown;
}

type IChanges<Value extends TControlObjectValue> = TControlUpdateData<Value> &
  TObjectExtraUpdateProps<Value>;

export class ControlObject<
  Value extends TControlObjectValue,
> extends AbstractControl<Value, IChanges<Value>> {
  public static create<Value extends TControlObjectValue>(
    props: IProps<Value>,
  ): TControl<Value> {
    return new ControlObject<Value>(props) as TControl<Value>;
  }

  private static modify<Value extends TControlObjectValue>(
    props: IProps<Value>,
    state: IState<Value>,
  ): TControl<Value> {
    return new ControlObject<Value>(props, state) as TControl<Value>;
  }

  public get required(): boolean {
    return this.data.noValueError !== null;
  }

  /**
   * Map of child controls
   */
  public readonly fields: TFormFields<Value>;
  public readonly isDirty: boolean;
  public readonly isValid: boolean;
  public readonly isValidating: boolean;
  public readonly isTouched: boolean;
  public readonly error: TControlError | null;

  protected readonly validator: Validator<Value>;

  private readonly state: IState<Value>;
  private readonly data: TControlDataObject<Value, unknown>;
  private readonly createChildNames: (
    names: TControlNames,
    key: keyof Value & string,
  ) => TControlNames;

  constructor(
    {
      data,
      value,
      defaultValue,
      isTouched,
      context,
      validationType,
      names,
      onReady,
      onChange,
      createChildNames,
    }: IProps<Value>,
    state?: IState<Value>,
  ) {
    super({
      value,
      defaultValue,
      context,
      createDescendantsContext: data.createDescendantsContext,
      descendantsContext: state
        ? state.descendantsContext
        : data.createDescendantsContext(value, context),
      needContextForDescendantsContext: data.needContextForDescendantsContext,
      names,
      validationType,
      onReady: onReady as TOnControlReady<Value>,
      onChange,
    });

    this.data = data;
    this.createChildNames = createChildNames;
    this.state = this.getState(state, value, this.data, isTouched);
    this.validator = this.state.validator;

    this.isDirty = this.state.childrenStore.isDirty;
    this.error = this.state.validator.error;
    this.isValid = this.error === null && this.state.childrenStore.isValid;
    this.isValidating =
      this.state.validator.isValidating ||
      this.state.childrenStore.isValidating;
    this.isTouched = this.state.childrenStore.isTouched;
    this.fields = this.state.childrenStore.fields;
    this.childValidationType = this.getChildValidationType(
      this.validationType,
      this.value,
    );
  }

  public setValue(
    newValue: TControlValue<Value>,
    extraProps?: TControlSetValueExtraProps,
  ): void {
    const reqExtraProps = this.getRequiredSetValueExtraProps(extraProps);
    for (const key in this.fields) {
      this.fields[key].setValue(
        newValue ? newValue[key] : undefined,
        reqExtraProps,
      );
    }
  }

  /**
   * Marks control as touched
   */
  public onTouch(): void {
    for (const key in this.fields) {
      this.fields[key].onTouch();
    }
  }

  protected applyUpdate(
    comparator: Comparator<Value>,
    updateData: IChanges<Value>,
  ): TControl<Value> | null {
    const isChildrenChanged = this.state.childrenStore.applyChildrenChanges(
      updateData.childrenUpdates,
      comparator,
    );

    if (comparator.shouldRecreate || isChildrenChanged) {
      return this.cloneWithChanges(comparator);
    }

    return null;
  }

  protected destroyState(): void {
    this.state.validator.destroy();
    this.state.childrenStore.destroy();
  }

  protected readonly getChildValidationType: TGetControlDescendantsValidationType<Value> =
    (currentType, value) => {
      if (value === undefined && !this.data.noValueError) {
        return FormValidationType.never;
      }

      return currentType;
    };

  private cloneWithChanges(comparator: Comparator<Value>): TControl<Value> {
    this.state.descendantsContext = comparator.descendantsContext.currentValue;
    return ControlObject.modify<Value>(
      {
        data: this.data,
        value: comparator.value.currentValue,
        defaultValue: comparator.defaultValue.currentValue,
        isTouched: this.state.childrenStore.isTouched,
        names: comparator.names.currentValue,
        context: comparator.context.currentValue,
        validationType: comparator.validationType.currentValue,
        onReady: this.onReady,
        onChange: this.onChange,
        createChildNames: this.createChildNames,
      },
      this.state,
    );
  }

  private getState(
    state: IState<Value> | undefined,
    value: TControlValue<Value>,
    data: TControlDataObject<Value, unknown>,
    isTouched: boolean,
  ): IState<Value> {
    const callbacks: TObjectChildrenStoreCallbacks<Value> = {
      onChildChange: (key, changes) => this.onChildChange(key, changes),
      createChildNames: (names, key) => this.createChildNames(names, key),
    };

    if (state) {
      state.validator.onControlInstanceChange(() => this.onChange({}));
      state.childrenStore.setCallbacks(callbacks);
      return state;
    }

    return {
      validator: new Validator<Value>({
        validate: data.validate,
        validationDebounceMs: data.validationDebounceMs,
        onFinishAsyncValidation: () => this.onChange({}),
        initialValues: {
          value,
          context: this.context,
          isTouched,
          validationType: this.validationType,
        },
        usesContext: this.data.usesContext,
        noValueError: this.data.noValueError,
      }),
      childrenStore: new ObjectChildrenStore<Value, unknown>(
        this.data.fieldsData,
        callbacks,
        {
          names: this.names,
          descendantsContext: this.descendantsContext,
          value,
          defaultValue: this.defaultValue,
          initialIsTouched: isTouched,
          validationType: this.validationType,
        },
      ),
      descendantsContext: this.descendantsContext,
    };
  }

  private onChildChange<Key extends keyof Value>(
    key: Key,
    changes: TControlUpdateData<Value[Key]>,
  ): void {
    const finalChanges: IChanges<Value> = {
      childrenUpdates: this.currentUpdatesData?.childrenUpdates ?? {},
    };

    finalChanges.childrenUpdates![key] = changes;

    if (Object.hasOwn(changes, 'value')) {
      finalChanges.value = this.getNewValue<Key>(key, changes.value);
    }

    this.emitChanges(finalChanges);
  }

  private getNewValue<Key extends keyof Value>(
    key: Key,
    value: TControlValue<Value[Key]>,
  ): TControlValue<Value> {
    const result =
      (this.currentUpdatesData &&
      Object.hasOwn(this.currentUpdatesData, 'value')
        ? this.currentUpdatesData.value
        : Object.assign({}, this.value)) ??
      ({} as NonNullable<TControlValue<Value>>);

    if (value === undefined) {
      delete result[key as keyof Value & string];
    } else {
      result[key as keyof Value & string] = value;
    }

    // This would mean that control's value is required and therefore should always be present
    if (this.data.noValueError) {
      return result;
    }

    // If control's value is optional and current value has no prop values should return undefined
    // It would help validator ignore missing child values
    return Object.keys(result).length > 0 ? result : undefined;
  }
}
