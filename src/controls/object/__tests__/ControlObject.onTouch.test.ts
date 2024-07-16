import { TControlUpdateData } from '../../../types';
import { ITestObject, createTestControl } from './utils';

describe('ControlBasic.onTouch', () => {
  test('If no child is touched should call update with all children touched', () => {
    const onChange = jest.fn();
    const expectedUpdate: TControlUpdateData<ITestObject> = {
      childrenUpdates: {
        id: { isTouched: true },
        name: { isTouched: true },
        surname: { isTouched: true },
        isAwesome: { isTouched: true },
      },
    };
    const [control] = createTestControl({ isTouched: false, onChange });

    control.onTouch();
    expect(onChange).toHaveBeenCalledWith(expectedUpdate);
  });

  test('If all children are touched should not call update', () => {
    const onChange = jest.fn();
    const [control] = createTestControl({ onChange, isTouched: true });

    control.onTouch();
    expect(onChange).not.toHaveBeenCalled();
  });
});
