import { TControlUpdateData } from '../../../types';
import { TTestArray, createTestControl } from './utils';

describe('ControlBasic.onTouch', () => {
  const value = ['1', 'bazinga', '2', 'zizinga'];

  test('If no child is touched should call update with all children touched', () => {
    const onChange = jest.fn();
    const expectedUpdate: TControlUpdateData<TTestArray> = {
      childrenUpdates: {
        changed: new Map(value.map((_val, index) => [index, { isTouched: true }])),
      },
    };
    const [control] = createTestControl({ isTouched: false, onChange, value });

    control.onTouch();
    expect(onChange).toHaveBeenCalledWith(expectedUpdate);
  });

  test('If all children are touched should not call update', () => {
    const onChange = jest.fn();
    const [control] = createTestControl({ onChange, isTouched: true, value });

    control.onTouch();
    expect(onChange).not.toHaveBeenCalled();
  });
});
