import { TControlUpdateData } from '../../../types';
import { TArrayExtraUpdateProps } from '../TArrayExtraUpdateProps';
import { TTestArray, createTestControl } from './utils';

type IChanges = TControlUpdateData<TTestArray> & TArrayExtraUpdateProps<TTestArray>;

describe('ControlArray.setValue', () => {
  describe('If new value is equal to old value', () => {
    const value: TTestArray = ['baz', 'in', 'ga'];

    test('If control was not touched before and noTouch is not provided should call onChange with isTouched == true', () => {
      const onChange = jest.fn();
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          changed: new Map(value.map((_val, index) => [index, { isTouched: true }])),
        },
        isTouched: true,
      };
      const [control] = createTestControl({ value, onChange, isTouched: false });

      control.setValue(value);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If control was not touched before and noTouch == true should not do anything', () => {
      const onChange = jest.fn();
      const [control] = createTestControl({ value, onChange, isTouched: false });

      control.setValue(value, { noTouch: true });
      expect(onChange).not.toHaveBeenCalled();
    });

    test('If control was touched before should not do anything', () => {
      const onChange = jest.fn();
      const [control] = createTestControl({ value, onChange, isTouched: true });

      control.setValue(value);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('If new value is not equal to old value', () => {
    test('If new value length is longer than previous value', () => {
      const onChange = jest.fn();
      const value: TTestArray = ['bza'];
      const newValue = ['baz', 'in', 'ga'];
      const [control] = createTestControl({ value, onChange, isTouched: true });
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          changed: new Map([[0, { value: newValue[0] }]]),
          added: new Map([[0, { before: [], after: [newValue[1], newValue[2]] }]]),
        },
        value: newValue,
      };

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If new value length is shorter than previous value', () => {
      const onChange = jest.fn();
      const value: TTestArray = ['baz', 'in', 'ga'];
      const newValue = ['something new'];
      const [control] = createTestControl({ value, onChange, isTouched: true });
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          changed: new Map([[0, { value: newValue[0] }]]),
          deleted: new Set([1, 2]),
        },
        value: newValue,
      };

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If new value is empty array', () => {
      const onChange = jest.fn();
      const value: TTestArray = ['baz', 'in', 'ga'];
      const [control] = createTestControl({ value, onChange, isTouched: true });
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          deleted: new Set([0, 1, 2]),
        },
        value: [],
      };

      control.setValue([]);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If new value is undefined', () => {
      const onChange = jest.fn();
      const value: TTestArray = ['baz', 'in', 'ga'];
      const [control] = createTestControl({ value, onChange, isTouched: true });
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          deleted: new Set([0, 1, 2]),
        },
        value: undefined,
      };

      control.setValue(undefined);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If initial value is empty', () => {
      const onChange = jest.fn();
      const newValue: TTestArray = ['baz', 'in', 'ga'];
      const [control] = createTestControl({ value: undefined, onChange, isTouched: true });
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          added: new Map([[0, { before: [], after: newValue }]]),
        },
        value: newValue,
      };

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If "noTouch" was not provided and isTouched == false should update value and isTouched', () => {
      const onChange = jest.fn();
      const value: TTestArray = ['baz', 'in', 'ga'];
      const newValue: TTestArray = ['ba', 'zi', 'nga'];
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          changed: new Map(newValue.map((value, index) => [index, { value, isTouched: true }])),
        },
        isTouched: true,
        value: newValue,
      };
      const [control] = createTestControl({ value, onChange });

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If "noTouch" was provided and isTouched == false should update only value', () => {
      const onChange = jest.fn();
      const value: TTestArray = ['baz', 'in', 'ga'];
      const newValue: TTestArray = ['ba', 'zi', 'nga'];
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          changed: new Map(newValue.map((value, index) => [index, { value }])),
        },
        value: newValue,
      };
      const [control] = createTestControl({ value, onChange, isTouched: true });

      control.setValue(newValue);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });
  });

  describe('Calling clear method', () => {
    describe('If initial value is not empty', () => {
      const value: TTestArray = ['baz', 'in', 'ga'];
      const expectedUpdate: IChanges = {
        childrenUpdates: {
          deleted: new Set(value.map((_item, index) => index)),
        },
        value: [],
      };

      test('If control is touched should emit only changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value, onChange, isTouched: true });

        control.clear();
        expect(onChange).toHaveBeenCalledWith(expectedUpdate);
      });

      test('If control is not touched should emit changes and touch control', () => {
        const onChange = jest.fn();
        const touchedExpectedUpdate: IChanges = {
          ...expectedUpdate,
          isTouched: true,
        };
        const [control] = createTestControl({ value, onChange, isTouched: false });

        control.clear();
        expect(onChange).toHaveBeenCalledWith(touchedExpectedUpdate);
      });

      test('If control is not touched and noTouch === true should emit only changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value, onChange, isTouched: false });

        control.clear({ noTouch: true });
        expect(onChange).toHaveBeenCalledWith(expectedUpdate);
      });
    });

    describe('If initial value is an empty array', () => {
      test('It control is touched should not emit changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value: [], onChange, isTouched: true });

        control.clear();
        expect(onChange).not.toHaveBeenCalled();
      });

      test('If control is not touched should emit isTouched = true', () => {
        const onChange = jest.fn();
        const expectedUpdate: IChanges = { isTouched: true };
        const [control] = createTestControl({ value: [], onChange, isTouched: false });

        control.clear();
        expect(onChange).toHaveBeenCalledWith(expectedUpdate);
      });

      test('It control is not touched and noTouch === true should not emit changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value: [], onChange, isTouched: false });

        control.clear({ noTouch: true });
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    describe('If initial value is undefined', () => {
      test('If control is touched should not emit changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value: undefined, onChange, isTouched: true });

        control.clear();
        expect(onChange).not.toHaveBeenCalled();
      });

      test('If control is not touched should emit isTouched = true', () => {
        const onChange = jest.fn();
        const expectedUpdate: IChanges = { isTouched: true };
        const [control] = createTestControl({ value: undefined, onChange, isTouched: false });

        control.clear();
        expect(onChange).toHaveBeenCalledWith(expectedUpdate);
      });

      test('It control is not touched and noTouch === true should not emit changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value: undefined, onChange, isTouched: false });

        control.clear({ noTouch: true });
        expect(onChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Calling push method', () => {
    const value: TTestArray = ['baz', 'in', 'ga'];

    describe('If calling with no arguments', () => {
      test('It control is touched should not emit changes', () => {
        const onChange = jest.fn();
        const [control] = createTestControl({ value, onChange, isTouched: true });

        control.push();
        expect(onChange).not.toHaveBeenCalled();
      });

      test('If control is not touched should emit isTouched = true', () => {
        const onChange = jest.fn();
        const expectedUpdate: IChanges = { isTouched: true };
        const [control] = createTestControl({ value, onChange, isTouched: false });

        control.push();
        expect(onChange).toHaveBeenCalledWith(expectedUpdate);
      });
    });
  });

  test('If calling setValue on child should emit changes with updated child and value', () => {
    const value: TTestArray = ['baz', 'in', 'ga'];
    const changedIndex = 1;
    const newValue = value.slice();
    newValue[changedIndex] = 'new ' + newValue[changedIndex];
    const onChange = jest.fn();
    const expectedUpdate: IChanges = {
      childrenUpdates: { changed: new Map([[changedIndex, { value: newValue[changedIndex] }]]) },
      value: newValue,
    };
    const [control] = createTestControl({ value, onChange, isTouched: true });

    control.list[changedIndex].control.setValue(newValue[changedIndex]);
    expect(onChange).toHaveBeenCalledWith(expectedUpdate);
  });

  describe('Calling delete on list items', () => {
    test('With one delete should emit changes with new value', () => {
      const value: TTestArray = ['baz', 'in', 'ga'];
      const indexToDelete = 1;
      const newValue = value.slice();
      newValue.splice(indexToDelete, 1);
      const onChange = jest.fn();
      const expectedUpdate: IChanges = {
        childrenUpdates: { deleted: new Set([indexToDelete]) },
        value: newValue,
        isTouched: true,
      };
      const [control] = createTestControl({ value, onChange, isTouched: false });

      control.list[indexToDelete].delete();
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('With several deletes should emit changes with new value', () => {
      const value: TTestArray = 'bazinga'.split('');
      const indexesToDelete = [5, 0, 6, 4];
      const newValue = value.slice();
      indexesToDelete
        .slice()
        .sort((a, b) => (a > b ? -1 : 1))
        .forEach((index) => newValue.splice(index, 1));
      const onChange = jest.fn();
      const expectedUpdate: IChanges = {
        childrenUpdates: { deleted: new Set(indexesToDelete) },
        value: newValue,
        isTouched: true,
      };
      const [control] = createTestControl({ value, onChange, isTouched: false });

      indexesToDelete.forEach((index) => control.list[index].delete());
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });

    test('If trying to delete same item several times should emit only one update', () => {
      const value: TTestArray = ['baz', 'in', 'ga'];
      const indexToDelete = 1;
      const newValue = value.slice();
      newValue.splice(indexToDelete, 1);
      const onChange = jest.fn();
      const expectedUpdate: IChanges = {
        childrenUpdates: { deleted: new Set([indexToDelete]) },
        value: newValue,
        isTouched: true,
      };
      const [control] = createTestControl({ value, onChange, isTouched: false });

      control.list[indexToDelete].delete();
      control.list[indexToDelete].delete();
      control.list[indexToDelete].delete();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(expectedUpdate);
    });
  });

  test('If calling update and delete on same item should ignore update part', () => {
    const value: TTestArray = ['baz', 'in', 'ga'];
    const indexToDelete = 1;
    const newValue = value.slice();
    newValue.splice(indexToDelete, 1);
    const onChange = jest.fn();
    const expectedUpdate: IChanges = {
      childrenUpdates: { deleted: new Set([indexToDelete]) },
      value: newValue,
      isTouched: true,
    };
    const [control] = createTestControl({ value, onChange, isTouched: false });

    control.list[indexToDelete].control.setValue('nnn');
    control.list[indexToDelete].delete();
    control.list[indexToDelete].control.setValue('bbb');
    expect(onChange).toHaveBeenCalledWith(expectedUpdate);
  });
});
