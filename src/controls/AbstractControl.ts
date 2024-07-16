import { TControlValue } from '../TControlValue';
import { TCreateDescendantsContext } from '../control-data';
import { TControlNames } from '../names';
import { TControlUpdateData } from '../types';
import { iterateObjectKeys } from '../utils';
import { FormValidationType, TControlError } from '../validation';
import { TControl } from './TControl';
import {
  IImmutableFormControlSetValueExtraProps,
  TGetImmutableFormControlDescendantsValidationType,
  TOnImmutableFormControlReady,
} from './types';
import { Comparator, Validator } from './utils';

interface IProps<Value, UpdateData extends TControlUpdateData<Value>> {
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  context: unknown;
  createDescendantsContext: TCreateDescendantsContext<Value, unknown, unknown>;
  descendantsContext: unknown;
  needContextForDescendantsContext: boolean;
  validationType: FormValidationType;
  names: TControlNames;
  onReady: TOnImmutableFormControlReady<Value>;
  onChange: (updateData: UpdateData) => void;
}

export abstract class AbstractControl<Value, UpdateData extends TControlUpdateData<Value>> {
  public get name(): string {
    return this.names.dynamic;
  }

  public abstract readonly isDirty: boolean;
  public abstract readonly isValid: boolean;
  public abstract readonly isValidating: boolean;
  public abstract readonly error: TControlError | null;
  public abstract readonly isTouched: boolean;

  public readonly value: TControlValue<Value>;
  public readonly defaultValue: TControlValue<Value>;

  protected abstract readonly validator: Validator<Value>;

  protected readonly needContextForDescendantsContext: boolean;
  protected readonly names: TControlNames;

  protected onReady: TOnImmutableFormControlReady<Value>;
  protected onChange: (updateData: UpdateData) => void;
  protected validationType: FormValidationType;
  protected childValidationType: FormValidationType;
  protected context: unknown;
  protected descendantsContext: unknown;
  protected currentUpdatesData?: UpdateData;

  private createDescendantsContext: (value: TControlValue<Value>, context: unknown) => unknown;
  private isDestroyed: boolean = false;

  constructor({
    value,
    defaultValue,
    context,
    createDescendantsContext,
    descendantsContext,
    needContextForDescendantsContext,
    validationType,
    names,
    onReady,
    onChange,
  }: IProps<Value, UpdateData>) {
    this.value = value;
    this.defaultValue = defaultValue;
    this.context = context;
    this.createDescendantsContext = createDescendantsContext;
    this.needContextForDescendantsContext = needContextForDescendantsContext;
    this.names = names;
    this.onChange = onChange;
    this.onReady = onReady;

    this.descendantsContext = descendantsContext;

    this.onReady({
      applyUpdate: (updateData) => {
        const newControl = this.applyUpdate(this.createComparator(updateData), updateData);
        if (newControl) {
          this.isDestroyed = true;
          this.currentUpdatesData = undefined;
        }

        return newControl;
      },
      clearUpdate: () => (this.currentUpdatesData = undefined),
      destroy: () => this.destroyControl(),
    });

    this.validationType = validationType;
    this.childValidationType = this.getChildValidationType(this.validationType, this.value);
  }

  public reset(): void {
    this.setValue(this.defaultValue);
  }

  protected abstract setValue(
    newValue: TControlValue<Value>,
    extraProps?: IImmutableFormControlSetValueExtraProps
  ): void;

  protected abstract applyUpdate(
    comparator: Comparator<Value>,
    updates: TControlUpdateData<Value>
  ): TControl<Value> | null;

  protected abstract destroyState(): void;

  protected getRequiredSetValueExtraProps(
    props: IImmutableFormControlSetValueExtraProps | undefined
  ): Required<IImmutableFormControlSetValueExtraProps> {
    return {
      noTouch: props?.noTouch ?? false,
    };
  }

  protected emitChanges(changes: UpdateData): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.currentUpdatesData) {
      iterateObjectKeys(changes, (key, value) => {
        this.currentUpdatesData![key] = value;
        return false;
      });
      if (Object.hasOwn(changes, 'value')) {
        this.onChange(this.currentUpdatesData);
      }
      return;
    }

    this.currentUpdatesData = changes;
    this.onChange(changes);
  }

  protected destroyControl(): void {
    this.destroyInstance();
    this.destroyState();
  }

  protected readonly getChildValidationType: TGetImmutableFormControlDescendantsValidationType<Value> = (type) => type;

  private createComparator(updateData: TControlUpdateData<Value>): Comparator<Value> {
    const result = new Comparator<Value>(
      {
        data: updateData,
        oldProps: {
          value: this.value,
          defaultValue: this.defaultValue,
          context: this.context,
          descendantsContext: this.descendantsContext,
          isTouched: this.isTouched,
          names: this.names,
          validationType: this.validationType,
          childValidationType: this.childValidationType,
        },
        createDescendantsContext: this.createDescendantsContext,
        needContextForDescendantsContext: this.needContextForDescendantsContext,
        validator: this.validator,
      },
      this.getChildValidationType
    );

    this.context = result.context.currentValue;
    this.descendantsContext = result.descendantsContext.currentValue;
    this.validationType = result.validationType.currentValue;
    this.childValidationType = result.childValidationType.currentValue;

    return result;
  }

  private destroyInstance(): void {
    this.isDestroyed = true;
    this.currentUpdatesData = undefined;
    this.onChange = () => {};
    this.context = undefined;
    this.descendantsContext = undefined;
    this.createDescendantsContext = () => {};
    this.onReady = () => {};
  }
}
