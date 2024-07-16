import { createBasic } from '../../../control-data';
import { TControlUpdateData } from '../../../types';
import { createTestControl } from './utils';

describe('ControlBasic.setValue', () => {
  describe('If new value is equal to old value', () => {
    test('If control was not touched before and noTouch is not provided should call onChange with isTouched == true', () => {
      const onChange = jest.fn();
      const value = 'string';
      const expectedUpdate: TControlUpdateData<string> = {
        isTouched: true,
      };
      const [control] = createTestControl({ data: createBasic({}), value, onChange });

      control.setValue(value);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If control was not touched before and noTouch == true should not do anything', () => {
      const onChange = jest.fn();
      const value = 'string';
      const [control] = createTestControl({ data: createBasic({}), value, onChange });

      control.setValue(value, { noTouch: true });
      expect(onChange).not.toHaveBeenCalled();
    });

    test('If control was touched before should not do anything', () => {
      const onChange = jest.fn();
      const value = 'string';
      const [control] = createTestControl({
        data: createBasic({}),
        value,
        onChange,
        isTouched: true,
      });

      control.setValue(value);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('If new value is not equal to old value', () => {
    test('If "noTouch" was not provided and isTouched == false should update value and isTouched', () => {
      const onChange = jest.fn();
      const value = 'string';
      const newValue = value + ' new';
      const expectedUpdate: TControlUpdateData<string> = {
        value: newValue,
        isTouched: true,
      };
      const [control] = createTestControl({ data: createBasic({}), value, onChange });

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If "noTouch" was provided and isTouched == false should update only value', () => {
      const onChange = jest.fn();
      const value = 'string';
      const newValue = value + ' new';
      const expectedUpdate: TControlUpdateData<string> = {
        value: newValue,
      };
      const [control] = createTestControl({ data: createBasic({}), value, onChange });

      control.setValue(newValue, { noTouch: true });
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If isTouched == true should update only value', () => {
      const onChange = jest.fn();
      const value = 'string';
      const newValue = value + ' new';
      const expectedUpdate: TControlUpdateData<string> = {
        value: newValue,
      };
      const [control] = createTestControl({
        data: createBasic({}),
        value,
        onChange,
        isTouched: true,
      });

      control.setValue(newValue, { noTouch: true });
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });
  });
});
