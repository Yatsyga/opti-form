import { act, renderHook } from '@testing-library/react-hooks/native';
import { createBasic } from '../control-data';
import { TControl } from '../controls';
import { OptiForm } from '../OptiForm';
import { useInputValue } from '../useInputValue';
import { FormValidationType } from '../validation';

function getForm(value: string) {
  return new OptiForm<{ value: string }, null>(
    {
      fieldsData: {
        value: createBasic({ noValueError: { message: 'message' } }),
      },
    },
    {
      value: { value: value },
      defaultValue: undefined,
      context: null,
      validationType: FormValidationType.always,
    },
  );
}

describe('useInputValue', () => {
  test('Initial value is equal to control value', () => {
    const value = 'bazinga';
    const form = getForm(value);

    const { result } = renderHook(() => useInputValue(form.fields.value));
    expect(result.current[0]).toBe(value);
  });

  test('Value is updated instantly on type and calls change to form', () => {
    const initialValue = 'initial';
    const newValue = 'new';
    const form = getForm(initialValue);
    jest.spyOn(form.fields.value, 'setValue');
    const { result } = renderHook(() => useInputValue(form.fields.value));

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toBe(newValue);
    expect(form.fields.value.setValue).toHaveBeenCalledWith(newValue);
  });

  test('If value is updated with provided callback and then changed somewhere else to initial value should return initial value', async () => {
    const initialValue = 'initial';
    const newValue = 'new';
    const form = getForm(initialValue);
    jest.spyOn(form.fields.value, 'setValue');
    const { result, rerender } = renderHook(
      ({ control }: { control: TControl<string> }) => useInputValue(control),
      { initialProps: { control: form.fields.value } },
    );

    act(() => {
      result.current[1](newValue);
    });
    form.fields.value.setValue(initialValue);
    rerender({ control: form.fields.value });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    rerender({ control: form.fields.value });

    expect(result.current[0]).toBe(initialValue);
  });
});
