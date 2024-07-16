import { createBasic } from '../../../control-data';
import { TControlUpdateData } from '../../../types';
import { createTestControl } from './utils';

describe('ControlBasic.onTouch', () => {
  test('If isTouched == false should call onChange', () => {
    const onChange = jest.fn();
    const expectedUpdate: TControlUpdateData<string> = {
      isTouched: true,
    };
    const [control] = createTestControl({ data: createBasic({}), onChange });

    control.onTouch();
    expect(onChange).toHaveBeenCalledWith(expectedUpdate);
  });

  test('If isTouched == true should not call onChange', () => {
    const onChange = jest.fn();
    const [control] = createTestControl({ data: createBasic({}), onChange, isTouched: true });

    control.onTouch();
    expect(onChange).not.toHaveBeenCalled();
  });
});
