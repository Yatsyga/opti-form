import { TControlValue } from '../../../TControlValue';
import {
    TControlDescendantsContextProps,
    TControlValidationData,
    TCreateDescendantsContext,
    createArray,
    createBasic,
} from '../../../control-data';
import { TControlNames } from '../../../names';
import { TControlUpdateData } from '../../../types';
import { FormValidationType, TValidateControl } from '../../../validation';
import { TControl } from '../../TControl';
import { createControl } from '../../createControl';
import { TControlInternalCallbacks } from '../../types';

export type TTestArray = string[];

type IProps<Context = unknown, DescendantsContext = unknown> = {
  value?: TControlValue<TTestArray>;
  defaultValue?: TControlValue<TTestArray>;
  context?: Context;
  validationType?: FormValidationType;
  isTouched?: boolean;
  arrayValidation?: Omit<TControlValidationData<TTestArray, Context>, 'noValueError'>;
  childrenValidation?: Omit<
    TControlValidationData<TTestArray[number], Context>,
    'noValueError'
  >;
  names?: TControlNames;
  onChange?: (updateData: TControlUpdateData<TTestArray>) => void;
  needContextForDescendantsContext?: boolean;
} & (TIsContextEqual<Context, DescendantsContext> extends true
  ? { createDescendantsContext?: TCreateDescendantsContext<TTestArray, Context, DescendantsContext> }
  : { createDescendantsContext: TCreateDescendantsContext<TTestArray, Context, DescendantsContext> });

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
  arrayValidation,
  childrenValidation,
  names,
  onChange,
  createDescendantsContext,
  needContextForDescendantsContext,
}: IProps<Context, DescendantsContext>): [
  TControl<TTestArray>,
  TControlInternalCallbacks<TTestArray, TControlUpdateData<TTestArray>>,
] {
  let callbacks = {} as TControlInternalCallbacks<TTestArray, TControlUpdateData<TTestArray>>;

  const control = createControl<TTestArray, Context>({
    data: createArray<TTestArray, unknown, unknown>(
      {
        childData: createBasic<string, unknown>({
          validate: childrenValidation?.validate as TValidateControl<string, unknown>,
          validationDebounceMs: childrenValidation?.validationDebounceMs,
          usesContext: childrenValidation?.usesContext,
        } as any),
        validate: arrayValidation?.validate as TValidateControl<TTestArray, unknown>,
        usesContext: arrayValidation?.usesContext as true,
        validationDebounceMs: arrayValidation?.validationDebounceMs,
      } as any,
      {
        createDescendantsContext:
          createDescendantsContext ??
          ((_value: any, context: Context) => {
            return context as unknown as DescendantsContext;
          }),
        usesContext: needContextForDescendantsContext,
      } as TControlDescendantsContextProps<TTestArray, unknown, unknown>
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

function cloneValue(
  value: TControlValue<TTestArray>
): TControlValue<TTestArray> {
  if (!value) {
    return undefined;
  }

  return value.slice();
}

test('Creation does not throw error', () => {
  expect(() => createTestControl({})).not.toThrow();
});
