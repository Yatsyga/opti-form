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
  /**
   * Current form value. Is immutable and only changes instance if form value changed
   */
  value: TControlValue<Value>;
  /**
   * Map of top-level form controls
   */
  fields: TFormFields<Value>;
  /**
   * Whether or not form contains validation errors
   */
  isValid: boolean;
  /**
   * Whether or not form is currently validating, can be true only if any control has async validation
   */
  isValidating: boolean;
  /**
   * Whether or not any control is touched
   */
  isTouched: boolean;
  /**
   * Whether or not current form value differs from default value
   */
  isDirty: boolean;
  /**
   * Applies errors list to form. Useful if you have backend validation and need to apply validation result to form
   */
  applyFlatErrorsList: (errors: TControlExternalErrorFlat[]) => void,
  /**
   * Returns promise that is resolved either with form value that fits the Value param (not TControlValue wrapper) or null.
   * Will be resolved with null if form contains any validation errors and with value otherwise.
   * If async validation is in progress, will be resolved after validation finishes, otherwise will be resolved instantly.
   */
  getValidValue: () => Promise<Value | null>,
  /**
   * Resets the form.
   * If no arg is provided will reset current value to current default value and mark all controls as not touched.
   */
  reset: (props?: TResetProps<Value>) => void,
}

/**
 * Creates form tree based on provided structure and provides all necessary data and methods
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
