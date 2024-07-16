import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ImmutableForm } from './ImmutableForm';
import { TControlExternalErrorFlat } from './TControlExternalErrorFlat';
import { TControlValue } from './TControlValue';
import { TControlDataFields } from './control-data';
import { TResetProps } from './types';
import { FormValidationType } from './validation';
import { TControlObjectValue } from './values';

interface IProps<Value extends TControlObjectValue, Context = never> {
  getFieldsData: () => TControlDataFields<Value, Context>;
  context: Context;
  validationType?: FormValidationType;
  defaultValue?: TControlValue<Value>;
  value?: TControlValue<Value>;
}

export function useImmutableForm<Value extends TControlObjectValue, Context = never>({
  getFieldsData,
  context,
  validationType = FormValidationType.always,
  defaultValue,
  value,
}: IProps<Value, Context>) {
  const [fieldsData] = useState<TControlDataFields<Value, Context>>(getFieldsData);

  const [form, setForm] = useState<ImmutableForm<Value, Context>>(() =>
    ImmutableForm.create({
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
