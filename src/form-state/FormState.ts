import { TControlValue } from '../TControlValue';
import {
    TControlDataFields,
    TControlDataObject,
    createObject,
} from '../control-data';
import { TControlInternalCallbacks } from '../controls';
import { ControlObject } from '../controls/object';
import { TControlUpdateData } from '../types';
import { CustomErrorHandler } from '../utils';
import { FormValidationType } from '../validation';
import { TControlObjectValue } from '../values';

interface IProps<Value extends TControlObjectValue, Context> {
  fieldsData: TControlDataFields<Value, Context>;
  value: TControlValue<Value>;
  defaultValue: TControlValue<Value>;
  context: Context;
  validationType: FormValidationType;
  onChange: (updateData: TControlUpdateData<Value>) => void;
}

interface TValueObserver<Value> {
  promise: Promise<Value | null>;
  resolve: () => void;
}

export class FormState<Value extends TControlObjectValue, Context> {
  public readonly customErrorsHandler: CustomErrorHandler<Value>;

  public rootControl: ControlObject<Value>;
  public validationType: FormValidationType;

  private rootCallbacks!: TControlInternalCallbacks<Value, TControlUpdateData<Value>>;
  private onChange: (updateData: TControlUpdateData<Value>) => void;
  private valueObserver: TValueObserver<Value> | null = null;

  constructor(props: IProps<Value, Context>) {
    this.onChange = props.onChange;
    this.validationType = props.validationType;

    const rootControlData = this.createRootControlData(props.fieldsData);
    this.customErrorsHandler = new CustomErrorHandler(rootControlData);
    this.rootControl = this.createRootControl(rootControlData, props);
  }

  public onInstanceChange(newOnChange: (updateData: TControlUpdateData<Value>) => void): void {
    this.onChange = newOnChange;
    if (this.rootControl.isValidating || !this.valueObserver) {
      return;
    }

    this.valueObserver.resolve();
  }

  public applyUpdate(updateData: TControlUpdateData<Value>): boolean {
    if (Object.hasOwn(updateData, 'validationType')) {
      this.validationType = updateData.validationType!;
    }

    const newControl = this.rootCallbacks.applyUpdate(updateData);
    if (!newControl) {
      if (!this.rootControl.isValidating && this.valueObserver) {
        this.valueObserver.resolve();
      }

      return false;
    }

    this.rootControl = newControl as ControlObject<Value>;
    return true;
  }

  public waitForValidValue(): Promise<Value | null> {
    if (!this.valueObserver) {
      let resolve: (value: Value | null) => void;
      const promise = new Promise<Value | null>((newResolve) => {
        resolve = newResolve;
      });

      this.valueObserver = {
        promise,
        resolve: () => {
          resolve(this.rootControl.isValid ? (this.rootControl.value as Value) : null);
          this.valueObserver = null;
        },
      };
    }

    return this.valueObserver.promise;
  }

  public destroy(): void {
    this.onChange = () => {};
    this.valueObserver = null;
    this.rootCallbacks.destroy();
  }

  private createRootControlData(
    fieldsData: TControlDataFields<Value, Context>
  ): TControlDataObject<Value, unknown> {
    return createObject<Value, Context>({
      fieldsData,
      usesContext: false,
    }) as TControlDataObject<Value, unknown>;
  }

  private createRootControl(
    data: TControlDataObject<Value, unknown>,
    { value, defaultValue, context, validationType }: IProps<Value, Context>
  ): ControlObject<Value> {
    return ControlObject.create<Value>({
      data,
      value,
      defaultValue,
      isTouched: false,
      context,
      validationType,
      names: { dynamic: '', static: '' },
      onReady: (newCallbacks) => {
        this.rootCallbacks = newCallbacks as TControlInternalCallbacks<
          Value,
          TControlUpdateData<Value>
        >;
      },
      onChange: (changes) => this.onChange(changes as TControlUpdateData<Value>),
      createChildNames: (_names, key) => ({ dynamic: key, static: key }),
    }) as ControlObject<Value>;
  }
}
