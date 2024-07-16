interface INewControlProps {
  value: any;
  isValid: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

export class ControlChildrenStatesStore<Key extends string> {
  private readonly invalidChildren = new Set<Key>();
  private readonly validatingChildren = new Set<Key>();
  private readonly dirtyChildren = new Set<Key>();
  private readonly touchedChildren = new Set<Key>();
  private readonly definedValueChildren = new Set<Key>();

  public setChild(id: Key, props: INewControlProps): void {
    this.setValid(id, props.isValid);
    this.setValidating(id, props.isValidating);
    this.setDirty(id, props.isDirty);
    this.setTouched(id, props.isTouched);
    this.setDefinedValue(id, props.value !== undefined);
  }

  public deleteChild(id: Key): void {
    this.invalidChildren.delete(id);
    this.validatingChildren.delete(id);
    this.dirtyChildren.delete(id);
    this.touchedChildren.delete(id);
    this.definedValueChildren.delete(id);
  }

  public getIsValid(): boolean {
    return this.invalidChildren.size === 0;
  }

  public getIsValidating(): boolean {
    return this.validatingChildren.size > 0;
  }

  public getIsDirty(): boolean {
    return this.dirtyChildren.size > 0;
  }

  public getIsTouched(): boolean {
    return this.touchedChildren.size > 0;
  }

  public getAnyChildIsDefined(): boolean {
    return this.definedValueChildren.size > 0;
  }

  private setValid(id: Key, value: boolean): void {
    this.setProperty(this.invalidChildren, id, !value);
  }

  private setValidating(id: Key, value: boolean): void {
    this.setProperty(this.validatingChildren, id, value);
  }

  private setDirty(id: Key, value: boolean): void {
    this.setProperty(this.dirtyChildren, id, value);
  }

  private setTouched(id: Key, value: boolean): void {
    this.setProperty(this.touchedChildren, id, value);
  }

  private setDefinedValue(id: Key, value: boolean): void {
    this.setProperty(this.definedValueChildren, id, value);
  }

  private setProperty(set: Set<Key>, id: Key, value: boolean): void {
    if (value) {
      set.add(id);
    } else {
      set.delete(id);
    }
  }
}
