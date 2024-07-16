import { TControlValue } from '../../../TControlValue';
import {
    TControlDescendantsContextProps,
    TControlValidationData,
    TCreateDescendantsContext,
    createBasic,
    createObject,
} from '../../../control-data';
import { TControlNames } from '../../../names';
import { TControlUpdateData } from '../../../types';
import {
    FormValidationType,
    TControlError,
    TValidateControl,
} from '../../../validation';
import { TControl } from '../../TControl';
import { createControl } from '../../createControl';
import { IImmutableFormControlInternalCallbacks } from '../../types';

export interface ITestObject {
  id: number | undefined;
  name: string | undefined;
  surname: string | undefined;
  isAwesome: boolean | undefined;
}

type IProps<Context = unknown, DescendantsContext = unknown> = {
  value?: TControlValue<ITestObject>;
  defaultValue?: TControlValue<ITestObject>;
  context?: Context;
  validationType?: FormValidationType;
  isTouched?: boolean;
  objectValidation?: Omit<TControlValidationData<ITestObject, Context>, 'noValueError'>;
  childrenValidation?: {
    [Key in keyof ITestObject]?: Omit<
      TControlValidationData<ITestObject[Key], DescendantsContext>,
      'noValueError'
    > & {
      noValueError?: TControlError;
    };
  };
  names?: TControlNames;
  onChange?: (updateData: TControlUpdateData<ITestObject>) => void;
  needContextForDescendantsContext?: boolean;
  isRequired?: boolean;
} & (TIsContextEqual<Context, DescendantsContext> extends true
  ? { createDescendantsContext?: TCreateDescendantsContext<ITestObject, Context, DescendantsContext> }
  : { createDescendantsContext: TCreateDescendantsContext<ITestObject, Context, DescendantsContext> });

type TIsContextEqual<Context, DescendantsContext> = Context extends DescendantsContext
  ? DescendantsContext extends Context
    ? true
    : false
  : false;

export function createTestControl<Context = unknown, DescendantsContext = Context>({
  value,
  defaultValue,
  context,
  validationType,
  isTouched,
  objectValidation,
  childrenValidation,
  names,
  onChange,
  createDescendantsContext,
  needContextForDescendantsContext,
  isRequired,
}: IProps<Context, DescendantsContext>): [
  TControl<ITestObject>,
  IImmutableFormControlInternalCallbacks<ITestObject, TControlUpdateData<ITestObject>>,
] {
  let callbacks = {} as IImmutableFormControlInternalCallbacks<
    ITestObject,
    TControlUpdateData<ITestObject>
  >;

  const control = createControl<ITestObject | undefined, Context>({
    data: createObject<ITestObject | undefined, unknown, unknown>(
      {
        validate: objectValidation?.validate as TValidateControl<ITestObject | undefined, Context>,
        usesContext: objectValidation?.usesContext as any,
        validationDebounceMs: objectValidation?.validationDebounceMs,
        noValueError: isRequired ? ({ message: 'bazinga' } as unknown as undefined) : undefined,
        fieldsData: {
          id: createBasic<ITestObject['id'], unknown>({
            usesContext: childrenValidation?.id?.usesContext as false,
            validate: childrenValidation?.id?.validate,
            validationDebounceMs: childrenValidation?.id?.validationDebounceMs,
          }),
          name: createBasic<ITestObject['name'], unknown>({
            usesContext: childrenValidation?.name?.usesContext as false,
            validate: childrenValidation?.name?.validate,
            validationDebounceMs: childrenValidation?.name?.validationDebounceMs,
          }),
          surname: createBasic<ITestObject['surname'], unknown>({
            usesContext: childrenValidation?.surname?.usesContext as false,
            validate: childrenValidation?.surname?.validate,
            validationDebounceMs: childrenValidation?.surname?.validationDebounceMs,
          }),
          isAwesome: createBasic<ITestObject['isAwesome'], unknown>({
            usesContext: childrenValidation?.isAwesome?.usesContext as false,
            validate: childrenValidation?.isAwesome?.validate,
            validationDebounceMs: childrenValidation?.isAwesome?.validationDebounceMs,
          }),
        },
      },
      {
        createDescendantsContext:
          createDescendantsContext ??
          ((_value: any, context: Context) => {
            return context as unknown as DescendantsContext;
          }),
        usesContext: needContextForDescendantsContext,
      } as TControlDescendantsContextProps<ITestObject, unknown, unknown>
    ),
    context: (context ?? undefined) as Context,
    value: cloneValue(value),
    defaultValue: cloneValue(defaultValue),
    isTouched: isTouched ?? false,
    names: names ?? { dynamic: 'dynamic', static: 'static' },
    onChange: onChange ?? (() => {}),
    onReady: (createdCallbacks) => {
      Object.assign(callbacks, createdCallbacks);
    },
    validationType: validationType ?? FormValidationType.always,
  });

  return [control, callbacks!];
}

export function createTestValue(index: number): ITestObject {
  return {
    id: index + 1,
    name: (index + 2).toString(),
    surname: (index + 3).toString(),
    isAwesome: index % 2 === 0,
  };
}

function cloneValue(
  value: TControlValue<ITestObject>
): TControlValue<ITestObject> {
  if (!value) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

test('Creation does not throw error', () => {
  expect(() => createTestControl({})).not.toThrow();
});
