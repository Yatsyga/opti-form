import { TControlValue } from '../../TControlValue';
import { TControlDataArray } from '../../control-data';
import { TControlNames } from '../../names';
import { TControlUpdateData } from '../../types';
import { FormValidationType, TControlError } from '../../validation';
import { TControlArrayValue } from '../../values';
import { AbstractControl } from '../AbstractControl';
import { TControl } from '../TControl';
import { IImmutableFormControlSetValueExtraProps, TOnImmutableFormControlReady } from '../types';
import { Comparator, Validator } from '../utils';
import { TArrayChildrenStoreCallbacks } from './TArrayChildrenStoreCallbacks';
import { TArrayExtraUpdateProps } from './TArrayExtraUpdateProps';
import { TControlArrayItem } from './TControlArrayItem';
import { ArrayChildrenStore } from './utils';

interface IProps<Value extends TControlArrayValue> {
  data: TControlDataArray<Value, unknown>;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  isTouched: boolean;
  context: unknown;
  validationType: FormValidationType;
  names: TControlNames;
  onReady: TOnImmutableFormControlReady<Value>;
  onChange: (updateData: TControlUpdateData<Value>) => void;
}

interface IState<Value extends TControlArrayValue> {
  validator: Validator<Value>;
  childrenStore: ArrayChildrenStore<Value, unknown>;
  descendantsContext: unknown;
}

type IChanges<Value extends TControlArrayValue> = TControlUpdateData<Value> &
  TArrayExtraUpdateProps<Value>;

export class ControlArray<
  Value extends TControlArrayValue,
> extends AbstractControl<Value, IChanges<Value>> {
  public static create<Value extends TControlArrayValue>(
    props: IProps<Value>
  ): TControl<Value> {
    return new ControlArray(props) as TControl<Value>;
  }

  private static modify<Value extends TControlArrayValue>(
    props: IProps<Value>,
    state: IState<Value>
  ): TControl<Value> {
    return new ControlArray<Value>(props, state) as TControl<Value>;
  }

  public readonly list: TControlArrayItem<Value[number]>[];
  public readonly isDirty: boolean;
  public readonly isValid: boolean;
  public readonly isValidating: boolean;
  public readonly isTouched: boolean;
  public readonly error: TControlError | null;

  protected readonly validator: Validator<Value>;

  private readonly state: IState<Value>;
  private readonly data: TControlDataArray<Value, unknown>;

  constructor(
    { data, value, defaultValue, isTouched, context, validationType, names, onReady, onChange }: IProps<Value>,
    state?: IState<Value>
  ) {
    super({
      value,
      defaultValue,
      context,
      createDescendantsContext: data.createDescendantsContext,
      descendantsContext: state ? state.descendantsContext : data.createDescendantsContext(value, context),
      names,
      validationType,
      needContextForDescendantsContext: data.needContextForDescendantsContext,
      onReady: onReady as TOnImmutableFormControlReady<Value>,
      onChange,
    });

    this.data = data;
    this.state = this.getState(state, this.data, isTouched);
    this.validator = this.state.validator;

    this.list = this.state.childrenStore.list;
    this.isDirty =
      this.state.childrenStore.isDirty ||
      (this.defaultValue ? this.defaultValue.length !== this.list.length : this.list.length > 0);
    this.error = this.state.validator.error;
    this.isValid = this.error === null && this.state.childrenStore.isValid;
    this.isValidating = this.state.validator.isValidating || this.state.childrenStore.isValidating;
    this.isTouched = isTouched || this.state.childrenStore.isTouched;
  }

  public setValue(
    newValue: TControlValue<Value>,
    extraProps?: IImmutableFormControlSetValueExtraProps
  ): void {
    const reqExtraProps = this.getRequiredSetValueExtraProps(extraProps);
    const newValueArr = newValue ?? ([] as unknown as NonNullable<TControlValue<Value>>);

    for (let index = 0, length = Math.min(this.list.length, newValueArr.length); index < length; index++) {
      this.list[index].control.setValue(newValueArr[index], reqExtraProps);
    }
    const added = newValueArr.slice(this.list.length);
    const deleted = new Set(
      Array(Math.max(this.list.length - newValueArr.length, 0))
        .fill(null)
        .map((_val, index) => newValueArr.length + index)
    );

    const changes: IChanges<Value> = {};
    const childrenUpdates: TArrayExtraUpdateProps<Value>['childrenUpdates'] = Object.assign(
      this.currentUpdatesData?.childrenUpdates ?? {},
      added.length > 0
        ? { added: new Map([[Math.max(this.list.length - 1, 0), { before: [], after: added }]]) }
        : undefined,
      deleted.size > 0 ? { deleted } : undefined
    );

    if (Object.keys(childrenUpdates!).length > 0) {
      changes.childrenUpdates = childrenUpdates;
    }
    if (added.length > 0 || deleted.size > 0) {
      changes.value = newValue;
    }
    if (!reqExtraProps.noTouch && !this.isTouched) {
      changes.isTouched = true;
    }

    if (Object.keys(changes).length > 0) {
      this.emitChanges(changes);
    }
  }

  public onTouch(): void {
    this.list.forEach(({ control }) => control.onTouch());
  }

  public push(...values: TControlValue<Value[number]>[]): void {
    const changes: IChanges<Value> = {};
    if (values.length > 0) {
      changes.childrenUpdates = this.currentUpdatesData?.childrenUpdates ?? {};
      if (!changes.childrenUpdates!.added) {
        changes.childrenUpdates!.added = new Map();
      }
      const lastIndex = Math.max(this.list.length - 1, 0);
      if (!changes.childrenUpdates!.added.has(lastIndex)) {
        changes.childrenUpdates!.added.set(lastIndex, { before: [], after: [] });
      }
      changes.childrenUpdates!.added.get(lastIndex)!.after.push(...values);
    }
    if (!this.isTouched) {
      changes.isTouched = true;
    }

    if (Object.keys(changes).length > 0) {
      this.emitChanges(changes);
    }
  }

  public clear(extraProps?: IImmutableFormControlSetValueExtraProps): void {
    this.setValue([] as unknown as TControlValue<Value>, extraProps);
  }

  protected applyUpdate(
    comparator: Comparator<Value>,
    updateData: IChanges<Value>
  ): TControl<Value> | null {
    const isChildrenChanged = this.state.childrenStore.applyChildrenChanges(updateData.childrenUpdates, comparator);

    if (comparator.shouldRecreate || isChildrenChanged) {
      return this.cloneWithChanges(comparator);
    }

    return null;
  }

  protected destroyState(): void {
    this.state.validator.destroy();
    this.state.childrenStore.destroy();
  }

  private cloneWithChanges(comparator: Comparator<Value>): TControl<Value> {
    this.state.descendantsContext = comparator.descendantsContext.currentValue;
    return ControlArray.modify<Value>(
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
    data: TControlDataArray<Value, unknown>,
    isTouched: boolean
  ): IState<Value> {
    const callbacks: TArrayChildrenStoreCallbacks<Value> = {
      onChildChange: (key, changes) => this.onChildChange(key, changes),
      onChildDelete: (index) => this.onChildDelete(index),
    };

    if (state) {
      state.validator.onControlInstanceChange(() => this.onChange({}));
      state.childrenStore.setCallbacks(callbacks);
      return state;
    }

    const descendantsContext = this.data.createDescendantsContext(this.value, this.context);

    return {
      validator: new Validator<Value>({
        validate: data.validate,
        validationDebounceMs: data.validationDebounceMs,
        onFinishAsyncValidation: () => this.onChange({}),
        initialValues: {
          value: this.value,
          context: this.context,
          isTouched,
          validationType: this.validationType,
        },
        usesContext: this.data.usesContext,
        noValueError: this.data.noValueError,
      }),
      childrenStore: new ArrayChildrenStore<Value, unknown>(this.data.childData, callbacks, {
        names: this.names,
        descendantsContext,
        value: this.value,
        defaultValue: this.defaultValue,
        isTouched: isTouched,
        validationType: this.validationType,
      }),
      descendantsContext,
    };
  }

  private onChildChange(index: number, changes: TControlUpdateData<Value[number]>): void {
    const finalChanges: IChanges<Value> = {
      childrenUpdates: this.currentUpdatesData?.childrenUpdates ?? {},
    };

    if (finalChanges.childrenUpdates!.deleted?.has(index)) {
      return;
    }

    if (!finalChanges.childrenUpdates!.changed) {
      finalChanges.childrenUpdates!.changed = new Map();
    }
    finalChanges.childrenUpdates!.changed!.set(index, changes);

    if (Object.hasOwn(changes, 'value')) {
      finalChanges.value = this.getNewValue(index, changes.value);
    }

    this.emitChanges(finalChanges);
  }

  private onChildDelete(index: number): void {
    if (this.currentUpdatesData?.childrenUpdates?.deleted?.has(index)) {
      return;
    }

    const finalChanges: IChanges<Value> = {
      childrenUpdates: this.currentUpdatesData?.childrenUpdates ?? {},
      value:
        this.currentUpdatesData && Object.hasOwn(this.currentUpdatesData, 'value')
          ? this.currentUpdatesData.value
          : (this.value?.slice() as TControlValue<Value>),
    };
    if (!finalChanges.childrenUpdates!.deleted) {
      finalChanges.childrenUpdates!.deleted = new Set();
    }

    let finalIndex = index;
    finalChanges.childrenUpdates!.deleted!.forEach((index) => {
      if (index < finalIndex) {
        finalIndex -= 1;
      }
    });

    if (!this.isTouched) {
      finalChanges.isTouched = true;
    }

    if (finalChanges.childrenUpdates!.changed?.has(index)) {
      finalChanges.childrenUpdates!.changed!.delete(index);
      if (finalChanges.childrenUpdates!.changed.size === 0) {
        delete finalChanges.childrenUpdates!.changed;
      }
    }

    finalChanges.childrenUpdates!.deleted!.add(index);
    finalChanges.value!.splice(finalIndex, 1);

    this.emitChanges(finalChanges);
  }

  private getNewValue(
    index: number,
    value: TControlValue<Value[number]>
  ): TControlValue<Value> {
    const result: TControlValue<Value> =
      (this.currentUpdatesData && Object.hasOwn(this.currentUpdatesData, 'value')
        ? this.currentUpdatesData.value
        : ((this.value?.slice() ?? []) as unknown as TControlValue<Value>)) ??
      ([] as unknown as NonNullable<TControlValue<Value>>);

    result![index] = value;

    return result;
  }
}
