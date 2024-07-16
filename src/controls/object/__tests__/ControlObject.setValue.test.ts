import { TControlUpdateData } from '../../../types';
import { TObjectExtraUpdateProps } from '../TObjectExtraUpdateProps';
import { ITestObject, createTestControl, createTestValue } from './utils';

type IChanges = TControlUpdateData<ITestObject> & TObjectExtraUpdateProps<ITestObject>;

describe('ControlObject.setValue', () => {
  describe('If new value is equal to old value', () => {
    test('If control was not touched before and noTouch is not provided should call onChange with isTouched == true', () => {
      const onChange = jest.fn();
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          id: { isTouched: true },
          name: { isTouched: true },
          surname: { isTouched: true },
          isAwesome: { isTouched: true },
        },
      };
      const [control] = createTestControl({ value, onChange, isTouched: false });

      control.setValue(value);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If control was not touched before and noTouch == true should not do anything', () => {
      const onChange = jest.fn();
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const [control] = createTestControl({ value, onChange, isTouched: false });

      control.setValue(value, { noTouch: true });
      expect(onChange).not.toHaveBeenCalled();
    });

    test('If control was touched before should not do anything', () => {
      const onChange = jest.fn();
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const [control] = createTestControl({ value, onChange, isTouched: true });

      control.setValue(value);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('If new value is not equal to old value', () => {
    test('If "noTouch" was not provided and isTouched == false should update value and isTouched', () => {
      const onChange = jest.fn();
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const newValue: ITestObject = {
        id: 2,
        name: '3',
        surname: '4',
        isAwesome: false,
      };
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          id: { value: newValue.id, isTouched: true },
          name: { value: newValue.name, isTouched: true },
          surname: { value: newValue.surname, isTouched: true },
          isAwesome: { value: newValue.isAwesome, isTouched: true },
        },
        value: newValue,
      };
      const [control] = createTestControl({ value, onChange });

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If "noTouch" was provided and isTouched == false should update only value', () => {
      const onChange = jest.fn();
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const newValue: ITestObject = {
        id: 2,
        name: '3',
        surname: '4',
        isAwesome: false,
      };
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          id: { value: newValue.id },
          name: { value: newValue.name },
          surname: { value: newValue.surname },
          isAwesome: { value: newValue.isAwesome },
        },
        value: newValue,
      };
      const [control] = createTestControl({ value, onChange, isTouched: true });

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If several children change synchronously should call onChange with final value', () => {
      const onChange = jest.fn();
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const newValue: ITestObject = {
        id: 2,
        name: '3',
        surname: '4',
        isAwesome: false,
      };
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          id: { value: newValue.id },
          name: { value: newValue.name },
          surname: { value: newValue.surname },
          isAwesome: { value: newValue.isAwesome },
        },
        value: newValue,
      };
      const [control] = createTestControl({ value, onChange, isTouched: true });

      for (const keyStr in control.fields) {
        const key = keyStr as keyof ITestObject;
        control.fields[key].setValue(newValue[key] as any);
      }
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });
  });

  test('If calling setValue on child control should emit changes with new value', () => {
    const onChange = jest.fn();
    const value: ITestObject = createTestValue(1);
    const changedProp: keyof ITestObject = 'name';
    const newValue: ITestObject = {
      ...value,
      [changedProp]: createTestValue(2)[changedProp],
    };
    const expectedUpdate: IChanges = {
      childrenUpdates: {
        [changedProp]: { value: newValue[changedProp] },
      },
      value: newValue,
    };
    const [control] = createTestControl({ value, onChange, isTouched: true });

    control.fields[changedProp].setValue(newValue[changedProp]);
    expect(onChange).toHaveBeenCalledWith(expectedUpdate);
  });
});
