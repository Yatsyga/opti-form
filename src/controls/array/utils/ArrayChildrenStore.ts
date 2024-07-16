import { TControlValue } from '../../../TControlValue';
import { TControlData } from '../../../control-data';
import { TControlNames, createArrayChildNames } from '../../../names';
import { TControlCustomError, TControlUpdateData } from '../../../types';
import { FormValidationType } from '../../../validation';
import { TControlArrayValue } from '../../../values';
import { TControl } from '../../TControl';
import { createControl } from '../../createControl';
import { IImmutableFormControlInternalCallbacks } from '../../types';
import { Comparator, ControlChildrenStatesStore } from '../../utils';
import { TArrayChildrenStoreCallbacks } from '../TArrayChildrenStoreCallbacks';
import { TArrayExtraUpdateProps } from '../TArrayExtraUpdateProps';
import { TControlArrayItem } from '../TControlArrayItem';

interface IProps<Value extends TControlArrayValue, DescendantsContext> {
  names: TControlNames;
  descendantsContext: DescendantsContext;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  isTouched: boolean;
  validationType: FormValidationType;
}

export type IChildrenMap<Value extends TControlArrayValue> = Record<
  string,
  {
    index: number;
    control: TControl<Value[number]>;
    callbacks: IImmutableFormControlInternalCallbacks<Value[number], TControlUpdateData<Value[number]>>;
  }
>;

export class ArrayChildrenStore<Value extends TControlArrayValue, DescendantsContext> {
  public get list(): TControlArrayItem<Value[number]>[] {
    return this.itemsList.slice();
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

  private readonly statesStore = new ControlChildrenStatesStore<string>();
  private readonly itemsList: TControlArrayItem<Value[number]>[];
  private readonly childrenMap: IChildrenMap<Value> = {};

  private idCounter: number = 0;

  constructor(
    private readonly childData: TControlData<Value[number], DescendantsContext>,
    private callbacks: TArrayChildrenStoreCallbacks<Value>,
    props: IProps<Value, DescendantsContext>
  ) {
    this.itemsList = this.createItemsList(props);
  }

  public applyChildrenChanges(
    updatesPre: TArrayExtraUpdateProps<Value>['childrenUpdates'],
    comparator: Comparator<Value>
  ): boolean {
    const updates = this.getFinalChildrenUpdates(updatesPre, comparator);
    if (!updates) {
      return false;
    }

    let anyChildChanged = Boolean(updates.added?.size || updates.deleted?.size);
    updates.changed?.forEach((update, index) => {
      const id = this.itemsList[index].id;
      const newControl = this.childrenMap[id].callbacks.applyUpdate(update);
      if (!newControl) {
        return;
      }

      anyChildChanged = true;
      this.itemsList[index] = new TControlArrayItem<Value[number]>(id, newControl, this.onChildDelete);
      this.statesStore.setChild(id, newControl);
    });

    const deletedIndexes = updates.deleted
      ? Array.from(updates.deleted).sort((item1, item2) => (item1 > item2 ? -1 : 1))
      : [];
    deletedIndexes.forEach((index) => {
      const id = this.itemsList[index].id;
      this.statesStore.deleteChild(id);
      this.itemsList.splice(index, 1);
      this.childrenMap[id].callbacks.destroy();
      delete this.childrenMap[id];
    });

    const props: IProps<Value, DescendantsContext> = {
      names: comparator.names.currentValue,
      descendantsContext: comparator.descendantsContext.currentValue as DescendantsContext,
      value: comparator.value.currentValue,
      defaultValue: comparator.defaultValue.currentValue,
      isTouched: false,
      validationType: comparator.validationType.currentValue,
    };

    updates.added?.forEach(({ after }) => {
      const index = Math.max(this.itemsList.length - 1, 0);
      const modifier = this.itemsList[index] ? 1 : 0;
      this.itemsList.splice(
        index + modifier,
        0,
        ...after.map((_val, itemIndex) => this.createNewListItem(index + itemIndex + modifier, props))
      );
    });

    const minDeletedIndex =
      deletedIndexes.length > 0 ? deletedIndexes[deletedIndexes.length - 1] : this.itemsList.length;
    for (let index = minDeletedIndex; index < this.itemsList.length; index++) {
      this.childrenMap[this.itemsList[index].id].index = index;
    }

    return anyChildChanged;
  }

  public setCallbacks(callbacks: TArrayChildrenStoreCallbacks<Value>): void {
    this.callbacks = callbacks;
  }

  public destroy(): void {
    for (const key in this.childrenMap) {
      this.childrenMap[key].callbacks.destroy();
      delete this.childrenMap[key];
      this.itemsList.splice(0);
    }
  }

  private createItemsList(props: IProps<Value, DescendantsContext>): TControlArrayItem<Value[number]>[] {
    const result: TControlArrayItem<Value[number]>[] = [];

    props.value?.forEach((_value, index) => {
      result.push(this.createNewListItem(index, props));
    });

    return result;
  }

  private readonly onChildDelete = (id: string) => this.callbacks.onChildDelete(this.childrenMap[id].index);

  private createNewListItem(
    index: number,
    { names, descendantsContext, value, defaultValue, isTouched, validationType }: IProps<Value, DescendantsContext>
  ): TControlArrayItem<Value[number]> {
    const id = this.idCounter.toString(16);
    this.idCounter += 1;

    let callbacks = {} as IImmutableFormControlInternalCallbacks<
      Value[number],
      TControlUpdateData<Value[number]>
    >;

    const control = createControl<Value[number], unknown>({
      data: this.childData as TControlData<Value[number], unknown>,
      context: descendantsContext,
      value: value?.[index] as TControlValue<Value[number]>,
      defaultValue: defaultValue?.[index] as TControlValue<Value[number]>,
      isTouched: isTouched,
      names: createArrayChildNames(names, index),
      validationType: validationType,
      onChange: (data) => {
        this.callbacks.onChildChange(this.childrenMap[id].index, data);
      },
      onReady: (newCallbacks) => Object.assign(callbacks, newCallbacks),
    });

    this.childrenMap[id] = { control, index, callbacks };
    this.statesStore.setChild(id, control);

    return new TControlArrayItem<Value[number]>(id, control, this.onChildDelete);
  }

  private getFinalChildrenUpdates(
    updateData: TArrayExtraUpdateProps<Value>['childrenUpdates'],
    comparator: Comparator<Value>
  ): TArrayExtraUpdateProps<Value>['childrenUpdates'] {
    const customErrorsMap = this.getCustomErrorsMap(comparator.customErrors, comparator.value.currentValue);

    if (
      !comparator.shouldEnrichDescendantsContext &&
      !updateData?.deleted?.size &&
      Object.keys(customErrorsMap).length === 0
    ) {
      return updateData;
    }

    const deleted = updateData?.deleted ?? new Set<number>();
    const minDeletedIndex = deleted.size > 0 ? Math.min(...Array.from(deleted)) : null;
    const changed = new Map<number, TControlUpdateData<Value[number]>>(updateData?.changed);

    for (let indexPre = 0; indexPre < this.itemsList.length; indexPre++) {
      if (deleted.has(indexPre)) {
        continue;
      }
      const deletedBefore =
        minDeletedIndex === null
          ? 0
          : Array.from(deleted).reduce((result, deletedIndex) => {
              return result + (indexPre > deletedIndex ? 1 : 0);
            }, 0);
      const index = indexPre - deletedBefore;

      const enrichedData = comparator.getEnrichedDescendantsUpdate({
        initialUpdate: changed.get(indexPre) ?? {},
        customErrors: customErrorsMap[indexPre],
        forceEnrich: deletedBefore > 0,
        getDefaultValue: (defaultValue) => (defaultValue ? defaultValue[index] : undefined),
        getNames: () => createArrayChildNames(comparator.names.currentValue, index),
      });
      changed.set(indexPre, enrichedData as TControlUpdateData<Value[number]>);
    }

    return Object.assign(updateData ?? {}, { changed });
  }

  private getCustomErrorsMap(
    customErrors: TControlCustomError[],
    newValue: TControlValue<Value>
  ): Record<number, TControlCustomError[]> {
    const result: Record<number, TControlCustomError[]> = {};

    if (newValue && newValue.length > 0) {
      customErrors.forEach(({ path, error }) => {
        if (path.length === 0) {
          return;
        }

        const newPath = path.slice();
        const indexStr = newPath.shift()!;
        const index = Number(indexStr);
        if (isNaN(index) || index < 0 || index >= newValue.length) {
          return;
        }

        if (!result[index]) {
          result[index] = [];
        }
        result[index]!.push({ path: newPath, error });
      });
    }

    return result;
  }
}
