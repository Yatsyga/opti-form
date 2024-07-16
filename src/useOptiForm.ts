import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { OptiForm } from './OptiForm';
import { TControlExternalErrorFlat } from './TControlExternalErrorFlat';
import { TControlValue } from './TControlValue';
import { TControlDataFields } from './control-data';
import { TFormFields, TResetProps } from './types';
import { FormValidationType } from './validation';
import { TControlObjectValue } from './values';

interface IProps<Value extends TControlObjectValue, Context = never> {
  getFieldsData: () => TControlDataFields<Value, Context>;
  context: Context;
  validationType?: FormValidationType;
  defaultValue?: TControlValue<Value>;
  value?: TControlValue<Value>;
}

interface IResult<Value extends TControlObjectValue> {
  value: TControlValue<Value>;
  fields: TFormFields<Value>;
  isValid: boolean;
  isValidating: boolean;
  isTouched: boolean;
  isDirty: boolean;
  applyFlatErrorsList: (errors: TControlExternalErrorFlat[]) => void,
  getValidValue: () => Promise<Value | null>,
  reset: (props?: TResetProps<Value>) => void,
}

/**
 * This hook will provide you will form tree data.
 * Props are:
 * @param getFieldsData this callback must return a tree structure that must fit provided
 * Value type and be created with createObject, createArray and createBasic methods
 * @param context this value is required only if you are using context for validation in child controls
 * @param validationType type of validation for form.
 * By default value is FormValidationType.always, which means that every control that has validation will be validated after each value or context change.
 * Other possible values are: FormValidationType.onlyTouched, which is same is always, but only touched controls are validated.
 * And FormValidationType.never, which means that no control is validated.
 * @param defaultValue: default value for form. This value matters only on first render, for changing defaultValue after first render use reset method.
 * @param value: initial value for form. By default equals defaultValue. This value matters only on first render, for changing value after first render use reset method.
 */
// @ts-expect-error: Typescript believes that this overload signature does not fit the implementation.
// Probably because of using "never" here, which I can not get rid of.
export function useOptiForm<Value extends TControlObjectValue>(props: Omit<IProps<Value, never>, 'context'>): IResult<Value>
export function useOptiForm<Value extends TControlObjectValue, Context>(props: IProps<Value, Context>): IResult<Value>
export function useOptiForm<Value extends TControlObjectValue, Context>({
  getFieldsData,
  context,
  validationType = FormValidationType.always,
  defaultValue,
  value = defaultValue,
}: IProps<Value, Context>): IResult<Value> {
  const [fieldsData] = useState<TControlDataFields<Value, Context>>(getFieldsData);

  const [form, setForm] = useState<OptiForm<Value, Context>>(() =>
    OptiForm.create({
      fieldsData,
      value,
      defaultValue,
      validationType,
      context,
    })
  );

  useLayoutEffect(() => form.setOnChange(setForm), [form]);

  const formRef = useRef(form);
  formRef.current = form;
  useLayoutEffect(() => formRef.current.setContext(context), [context]);
  useLayoutEffect(() => formRef.current.setValidationType(validationType), [validationType]);

  const reset = useCallback((props?: TResetProps<Value>) => {
    formRef.current.reset(props);
  }, []);

  const getValidValue = useCallback(() => formRef.current.getValidValue(), []);

  const applyFlatErrorsList = useCallback(
    (errors: TControlExternalErrorFlat[]) => formRef.current.applyFlatErrorsList(errors),
    []
  );

  return {
    value: form.value,
    fields: form.fields,
    isValid: form.isValid,
    isValidating: form.isValidating,
    isTouched: form.isTouched,
    isDirty: form.isDirty,
    applyFlatErrorsList,
    getValidValue,
    reset,
  };
}
