import { TControlValue } from '../../../TControlValue';
import { TControlData, TControlDataFields } from '../../../control-data';
import { TControlNames } from '../../../names';
import {
  TControlCustomError,
  TControlUpdateData,
  TFormFields,
} from '../../../types';
import { FormValidationType } from '../../../validation';
import { TControlObjectValue } from '../../../values';
import { TControl } from '../../TControl';
import { createControl } from '../../createControl';
import { IImmutableFormControlInternalCallbacks } from '../../types';
import { Comparator, ControlChildrenStatesStore } from '../../utils';
import { TObjectChildrenStoreCallbacks } from '../TObjectChildrenStoreCallbacks';
import { TObjectExtraUpdateProps } from '../TObjectExtraUpdateProps';

interface IProps<Value extends TControlObjectValue, DescendantsContext> {
  names: TControlNames;
  descendantsContext: DescendantsContext;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  initialIsTouched: boolean;
  validationType: FormValidationType;
}

type TChildrenMap<Value extends TControlObjectValue> = {
  [Key in keyof Value]: {
    control: TControl<Value[Key]>;
    callbacks: IImmutableFormControlInternalCallbacks<Value[Key], TControlUpdateData<Value[Key]>>;
  };
};

export class ObjectChildrenStore<
  Value extends TControlObjectValue,
  DescendantsContext,
> {
  public get fields(): TFormFields<Value> {
    const result: Partial<TFormFields<Value>> = {};

    for (const key in this.childrenMap) {
      result[key] = this.childrenMap[key].control;
    }

    return Object.freeze(result) as TFormFields<Value>;
  }

  public get isValid(): boolean {
    return this.statesStore.getIsValid();
  }

  public get isValidating(): boolean {
    return this.statesStore.getIsValidating();
  }

  public get isDirty(): boolean {
    return this.statesStore.getIsDirty();
  }

  public get isTouched(): boolean {
    return this.statesStore.getIsTouched();
  }

  public get anyChildIsDefined(): boolean {
    return this.statesStore.getAnyChildIsDefined();
  }

  private readonly statesStore = new ControlChildrenStatesStore<keyof Value & string>();
  private readonly childrenMap: TChildrenMap<Value>;

  constructor(
    private readonly fieldsData: TControlDataFields<Value, DescendantsContext>,
    private callbacks: TObjectChildrenStoreCallbacks<Value>,
    props: IProps<Value, DescendantsContext>
  ) {
    this.childrenMap = this.createChildrenMap(props);
  }

  public applyChildrenChanges(
    updatesPre: TObjectExtraUpdateProps<Value>['childrenUpdates'],
    comparator: Comparator<Value>
  ): boolean {
    const updates = this.getFinalChildrenUpdates(updatesPre, comparator);
    if (!updates) {
      return false;
    }

    let anyChildChanged = false;
    for (const keyStr in updates) {
      const key = keyStr as keyof Value & string;

      const newControl = this.childrenMap[key].callbacks.applyUpdate(updates[key]!);
      if (newControl) {
        anyChildChanged = true;
        this.childrenMap[key].control = newControl;
        this.statesStore.setChild(key, newControl);
      }
    }

    return anyChildChanged;
  }

  public setCallbacks(callbacks: TObjectChildrenStoreCallbacks<Value>): void {
    this.callbacks = callbacks;
  }

  public destroy(): void {
    for (const keyStr in this.childrenMap) {
      const key = keyStr as keyof Value;
      this.childrenMap[key].callbacks.destroy();
      delete this.childrenMap[key];
    }
  }

  private createChildrenMap(props: IProps<Value, DescendantsContext>): TChildrenMap<Value> {
    const result: Partial<TChildrenMap<Value>> = {};

    for (const keyStr in this.fieldsData) {
      const key = keyStr as string & keyof TFormFields<Value>;
      let callbacks = {} as IImmutableFormControlInternalCallbacks<
        Value[typeof key],
        TControlUpdateData<Value[typeof key]>
      >;

      const control = createControl<Value[typeof key], unknown>({
        data: this.fieldsData[key] as TControlData<Value[typeof key], unknown>,
        context: props.descendantsContext,
        value: props.value ? props.value[key] : undefined,
        defaultValue: props.defaultValue ? props.defaultValue[key] : undefined,
        isTouched: props.initialIsTouched,
        names: this.callbacks.createChildNames(props.names, key),
        validationType: props.validationType,
        onChange: (data) => this.callbacks.onChildChange(key, data),
        onReady: (newCallbacks) => Object.assign(callbacks, newCallbacks),
      });

      this.statesStore.setChild(key, control);

      result[key] = { control, callbacks };
    }

    return result as TChildrenMap<Value>;
  }

  private getFinalChildrenUpdates(
    updateData: TObjectExtraUpdateProps<Value>['childrenUpdates'],
    comparator: Comparator<Value>
  ): TObjectExtraUpdateProps<Value>['childrenUpdates'] {
    const customErrorsMap = this.getCustomErrorsMap(comparator.customErrors);
    if (!comparator.shouldEnrichDescendantsContext && Object.keys(customErrorsMap).length === 0) {
      return updateData;
    }

    const result: TObjectExtraUpdateProps<Value>['childrenUpdates'] = {};

    for (const key in this.fields) {
      result[key] = comparator.getEnrichedDescendantsUpdate({
        initialUpdate: updateData?.[key] ?? {},
        customErrors: customErrorsMap[key],
        getDefaultValue: (defaultValue) => defaultValue![key],
        getNames: () => this.callbacks.createChildNames(comparator.names.currentValue, key),
      });
    }

    return result;
  }

  private getCustomErrorsMap(
    customErrors: TControlCustomError[]
  ): Partial<Record<keyof Value, TControlCustomError[]>> {
    const result: Partial<Record<keyof Value, TControlCustomError[]>> = {};

    customErrors.forEach(({ path, error }) => {
      if (path.length === 0) {
        return;
      }

      const newPath = path.slice();
      const key = newPath.shift()!;
      if (!this.checkKeyExists(key)) {
        return;
      }

      if (!result[key]) {
        result[key] = [];
      }
      result[key]!.push({ path: newPath, error });
    });

    return result;
  }

  private checkKeyExists(key: string | number | symbol): key is keyof Value {
    return key in this.fields;
  }
}
