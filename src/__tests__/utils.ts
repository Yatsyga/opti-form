import { ImmutableForm } from '../ImmutableForm';
import { TControlValue } from '../TControlValue';
import {
    TControlDataFields,
    TControlDescendantsPath,
    TControlDescendantsPathDynamic,
    createArray,
    createBasic,
    createObject,
} from '../control-data';
import { ControlArray, ControlObject, TControl } from '../controls';
import { FormValidationType, TControlError } from '../validation';

export interface ITestFormValue {
  title: string;
  starter?: ITestFormPerson;
  finisher?: ITestFormPerson;
  other: ITestFormPerson[];
  additionalData: {
    people: ITestFormPerson[];
    date: Date;
  };
}

interface ITestFormPerson {
  id: number;
  name: string;
  surname: string;
}

interface IProps {
  value?: TControlValue<ITestFormValue>;
  defaultValue?: TControlValue<ITestFormValue>;
  context?: Set<string>;
  validationType?: FormValidationType;
  asyncValidationDebounceValue?: number;
  asyncValidationDuration?: number;
}

const noValueError: TControlError = {
  message: 'Field is required',
};

export interface ITestControlData {
  value: any;
  defaultValue: any;
  // isValid: boolean;
  isValidating: boolean;
  error: TControlError | null;
  isTouched: boolean;
  isDirty: boolean;
}

export type IImmutableFormTestState = Partial<
  Record<
    TControlDescendantsPathDynamic<ITestFormValue> | TControlDescendantsPath<ITestFormValue>,
    ITestControlData
  >
>;

export function getFlattenedValue(
  value: TControlValue<ITestFormValue>
): Partial<Record<TControlDescendantsPathDynamic<ITestFormValue>, any>> {
  return flattenValue(value, {}, '');
}

function flattenValue(value: any, result: Record<string, any>, prevPath: string): Record<string, any> {
  if (prevPath) {
    result[prevPath] = value;
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => flattenValue(child, result, prevPath + `[${index}]`));
  } else if (typeof value === 'object' && value) {
    for (const key in value) {
      flattenValue(value[key], result, prevPath ? prevPath + '.' + key : key);
    }
  }

  return result;
}

export const testForbiddenSurname: TControlError = {
  message: 'Value is forbidden',
};

export class TestForm {
  public form: ImmutableForm<ITestFormValue, Set<string>>;
  public updatesCount: number = 0;

  private promiseUpdate?: Promise<void>;
  private onUpdate: () => void = () => {};

  constructor(props: IProps) {
    this.form = ImmutableForm.create<ITestFormValue, Set<string>>({
      fieldsData: this.createFieldsData(props),
      value: props.value,
      defaultValue: props.defaultValue,
      validationType: props.validationType ?? FormValidationType.always,
      context: props.context ?? new Set<string>(),
    });

    this.form.setOnChange((newForm) => {
      this.updatesCount++;
      this.form = newForm;
      this.onUpdate();
      this.onUpdate = () => {};
      this.promiseUpdate = undefined;
    });
  }

  public getState(expectedState: IImmutableFormTestState): IImmutableFormTestState {
    const requiredFields = new Set(
      Object.keys(expectedState) as TControlDescendantsPathDynamic<ITestFormValue>[]
    );
    const result: IImmutableFormTestState = {};

    for (const key in this.form.fields) {
      this.fillState(
        result,
        this.form.fields[key as keyof ITestFormValue] as TControl<any>,
        requiredFields
      );
    }

    return result;
  }

  public waitForUpdate(): Promise<void> {
    if (!this.promiseUpdate) {
      this.promiseUpdate = new Promise((resolve) => {
        this.onUpdate = resolve;
      });
    }

    return this.promiseUpdate;
  }

  private fillState(
    state: IImmutableFormTestState,
    control: TControl<any>,
    requiredFields: Set<TControlDescendantsPathDynamic<ITestFormValue>>
  ): void {
    const name = control.name as TControlDescendantsPathDynamic<ITestFormValue>;
    if (requiredFields.has(name)) {
      state[name] = {
        value: control.value,
        defaultValue: control.defaultValue,
        // isValid: control.isValid,
        isValidating: control.isValidating,
        error: control.error,
        isTouched: control.isTouched,
        isDirty: control.isDirty,
      };
    }

    if (control instanceof ControlArray) {
      control.list.forEach((child) => this.fillState(state, child.control, requiredFields));
      return;
    }
    if (control instanceof ControlObject) {
      for (const key in control.fields) {
        this.fillState(state, control.fields[key], requiredFields);
      }
      return;
    }
  }

  private createFieldsData(props: IProps): TControlDataFields<ITestFormValue, Set<string>> {
    return {
      title: createBasic({ noValueError }),
      starter: createObject({
        fieldsData: {
          id: createBasic({ noValueError }),
          name: createBasic({ noValueError }),
          surname: createBasic({
            noValueError,
            usesContext: true,
            validate: (val, context) => (context.has(val!) ? testForbiddenSurname : null),
          }),
        },
      }),
      finisher: createObject({
        fieldsData: {
          id: createBasic({ noValueError }),
          name: createBasic({ noValueError }),
          surname: createBasic({
            noValueError,
            usesContext: true,
            validate: (val, context) => (context.has(val!) ? testForbiddenSurname : null),
          }),
        },
      }),
      other: createArray<ITestFormValue['other'], Set<string>, Set<string> | null>(
        {
          childData: createObject({
            fieldsData: {
              id: createBasic({ noValueError }),
              name: createBasic({ noValueError }),
              surname: createBasic({
                noValueError,
                usesContext: true,
                validate: (val, context) => {
                  if (context === null) {
                    return null;
                  }

                  const result: TControlError | null = context.has(val!) ? testForbiddenSurname : null;

                  return new Promise((resolve) => {
                    setTimeout(() => resolve(result), props.asyncValidationDuration ?? 0);
                  });
                },
                validationDebounceMs: props.asyncValidationDebounceValue,
              }),
            },
            noValueError,
          }),
          noValueError,
        },
        {
          createDescendantsContext: (_val, context) => (context.size > 5 ? context : null),
          usesContext: true,
        }
      ),
      additionalData: createObject({
        fieldsData: {
          people: createArray({
            childData: createObject({
              fieldsData: {
                id: createBasic({ noValueError }),
                name: createBasic({ noValueError }),
                surname: createBasic({
                  noValueError,
                  usesContext: true,
                  validate: (val, context) => (context.has(val!) ? testForbiddenSurname : null),
                }),
              },
              noValueError,
            }),
            noValueError,
          }),
          date: createBasic({ noValueError }),
        },
        noValueError,
      }),
    };
  }
}

type IExtraProps = Partial<
  Record<
    TControlDescendantsPathDynamic<ITestFormValue> | TControlDescendantsPath<ITestFormValue>,
    Partial<Omit<ITestControlData, 'value' | 'defaultValue' | 'isValid'>>
  >
>;

export class TestImmutableFormStateCollector {
  public readonly expectedState: IImmutableFormTestState;
  public readonly actualState: IImmutableFormTestState;

  private readonly flattenedValue: Record<string, any>;
  private readonly flattenedDefaultValue: Record<string, any>;
  private readonly extraProps: IExtraProps;

  constructor({
    value,
    defaultValue,
    extraProps = {},
    testForm,
  }: {
    value: TControlValue<ITestFormValue>;
    defaultValue: TControlValue<ITestFormValue>;
    extraProps?: IExtraProps;
    testForm: TestForm;
  }) {
    this.flattenedValue = getFlattenedValue(value);
    this.flattenedDefaultValue = getFlattenedValue(defaultValue);
    this.extraProps = extraProps;

    this.expectedState = {};
    for (const keyStr in this.flattenedValue) {
      const key = keyStr as TControlDescendantsPathDynamic<ITestFormValue>;
      this.expectedState[key as TControlDescendantsPath<ITestFormValue>] = {
        value: this.flattenedValue[key],
        defaultValue: this.flattenedDefaultValue[key],
        // isValid: this.checkIsValid(key),
        isValidating: this.extraProps[key]?.isValidating ?? false,
        error: this.extraProps[key]?.error ?? null,
        isTouched: this.extraProps[key]?.isTouched ?? this.checkIsTouched(key),
        isDirty: this.extraProps[key]?.isDirty ?? this.checkIsDirty(key),
      };
    }

    this.actualState = testForm.getState(this.expectedState);
  }

  private checkIsDirty(key: TControlDescendantsPathDynamic<ITestFormValue>): boolean {
    if (this.flattenedValue[key] === this.flattenedDefaultValue[key]) {
      return false;
    }

    if (this.flattenedValue[key] instanceof Date && this.flattenedDefaultValue[key] instanceof Date) {
      return this.flattenedValue[key].getTime() !== this.flattenedDefaultValue[key].getTime();
    }

    if (
      (typeof this.flattenedValue[key] === 'object' && this.flattenedValue[key]) ||
      (typeof this.flattenedDefaultValue[key] === 'object' && this.flattenedDefaultValue[key])
    ) {
      for (const otherKey in this.flattenedValue) {
        if (otherKey === key || !otherKey.startsWith(key)) {
          continue;
        }

        if (this.checkIsDirty(otherKey as TControlDescendantsPathDynamic<ITestFormValue>)) {
          return true;
        }
      }

      return false;
    }

    return true;
  }

  private checkIsValid(key: TControlDescendantsPathDynamic<ITestFormValue>): boolean {
    for (const otherKeyStr in this.extraProps) {
      const otherKey = otherKeyStr as TControlDescendantsPathDynamic<ITestFormValue>;
      if (!otherKey.startsWith(key)) {
        continue;
      }

      if (this.extraProps[otherKey]!.error) {
        return false;
      }
    }

    return true;
  }

  private checkIsTouched(key: TControlDescendantsPathDynamic<ITestFormValue>): boolean {
    for (const otherKeyStr in this.extraProps) {
      const otherKey = otherKeyStr as TControlDescendantsPathDynamic<ITestFormValue>;
      if (!otherKey.startsWith(key)) {
        continue;
      }

      if (this.extraProps[otherKey]!.isTouched) {
        return true;
      }
    }

    return false;
  }
}

export function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    const result: any[] = [];
    value.forEach((item) => result.push(cloneDeep(item)));
    return result as T;
  }
  if (value instanceof Date) {
    return new Date(value) as T;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key in value) {
      result[key] = cloneDeep(value[key]);
    }
    return result as T;
  }

  return value;
}

test('test', () => {
  expect(1).toBe(1);
});
