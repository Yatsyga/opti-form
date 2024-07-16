import { createBasic } from '../../../control-data';
import { TControlNames } from '../../../names';
import { FormValidationType, TControlError } from '../../../validation';
import { createTestControl } from './utils';

describe('ControlBasic.constructor', () => {
  test('Control has exact props that were passed to it`s constructor', () => {
    const value = 3;
    const defaultValue = 5;

    const [control] = createTestControl<number | undefined>({
      data: createBasic({}),
      value,
      defaultValue,
    });
    expect(control.value).toBe(value);
    expect(control.defaultValue).toBe(defaultValue);
  });

  describe('Setting isDirty property', () => {
    test('If value equals defaultValue isDirty must be false', () => {
      const value = 3;

      const [control] = createTestControl<number | undefined>({
        data: createBasic({}),
        value,
        defaultValue: value,
      });
      expect(control.isDirty).toBe(false);
    });

    test('If value does not equal defaultValue isDirty must be false', () => {
      const value = 3;
      const defaultValue = value + 1;

      const [control] = createTestControl<number | undefined>({
        data: createBasic({}),
        value,
        defaultValue,
      });
      expect(control.isDirty).toBe(true);
    });
  });

  test('Setting name property', () => {
    const names: TControlNames = { dynamic: 'bazinga', static: 'unused' };

    const [control] = createTestControl<number | undefined>({ data: createBasic({}), names });
    expect(control.name).toBe(names.dynamic);
  });

  describe('Setting isTouched property', () => {
    test('If isTouched === true should set it to true', () => {
      const isTouched = true;

      const [control] = createTestControl<number | undefined>({
        data: createBasic({}),
        isTouched,
      });
      expect(control.isTouched).toBe(isTouched);
    });

    test('If isTouched === true should set it to true', () => {
      const isTouched = false;

      const [control] = createTestControl<number | undefined>({
        data: createBasic({}),
        isTouched,
      });
      expect(control.isTouched).toBe(isTouched);
    });
  });

  describe('Initial validation', () => {
    test('With validationType "never" should not call validation', () => {
      const validate = jest.fn().mockReturnValue(null);

      const [control] = createTestControl<number | undefined>({
        data: createBasic({ validate }),
        validationType: FormValidationType.never,
      });
      expect(control.isValid).toBe(true);
      expect(validate).not.toHaveBeenCalled();
    });

    describe('With validation type "onlyTouched"', () => {
      test('If control is not touched should not call validation', () => {
        const validate = jest.fn().mockReturnValue(null);

        const [control] = createTestControl<number | undefined>({
          data: createBasic({ validate }),
          validationType: FormValidationType.onlyTouched,
        });
        expect(control.isValid).toBe(true);
        expect(validate).not.toHaveBeenCalled();
      });

      test('If control is touched should call validation', () => {
        const validate = jest.fn().mockReturnValue(null);

        createTestControl<number | undefined>({
          data: createBasic({ validate }),
          validationType: FormValidationType.onlyTouched,
          isTouched: true,
        });
        expect(validate).toHaveBeenCalled();
      });
    });

    describe('With validationType "always" should call validation', () => {
      test('Should use provided value and context', () => {
        const validate = jest.fn().mockReturnValue(null);
        const value = 42;
        const context = 'order66';

        const [control] = createTestControl<number | undefined>({
          data: createBasic({ validate, usesContext: true }),
          validationType: FormValidationType.always,
          value,
          context,
        });
        expect(control.isValid).toBe(true);
        expect(validate).toHaveBeenCalledWith(value, context);
      });

      describe('With synchronous validation', () => {
        test('If validation returns null should put it to control.error and set isValid as true', () => {
          const validate = jest.fn().mockReturnValue(null);

          const [control] = createTestControl<number | undefined>({
            data: createBasic({ validate }),
            validationType: FormValidationType.always,
          });
          expect(control.isValid).toBe(true);
          expect(control.error).toBeNull();
          expect(validate).toHaveBeenCalled();
        });

        test('If validation returns error should put it to control.error and set isValid as false', () => {
          const error: TControlError = {
            message: 'Something wrong here',
          };
          const validate = jest.fn().mockReturnValue(error);

          const [control] = createTestControl<number | undefined>({
            data: createBasic({ validate }),
            validationType: FormValidationType.always,
          });
          expect(control.isValid).toBe(false);
          expect(control.error).toBe(error);
          expect(validate).toHaveBeenCalled();
        });
      });

      describe('If validation returns promise should set isValidating = true until promise is resolved', () => {
        test('If promise is resolved with null should call on change and on next update create valid instance', async () => {
          const validate = jest.fn().mockReturnValue(Promise.resolve(null));
          const onChange = jest.fn();

          const [control, { applyUpdate }] = createTestControl<number | undefined>({
            data: createBasic({ validate }),
            validationType: FormValidationType.always,
            onChange,
          });
          expect(control.isValid).toBe(true);
          expect(control.error).toBeNull();
          expect(control.isValidating).toBe(true);
          expect(validate).toHaveBeenCalled();
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({})!;
          expect(newControl).not.toBe(null);
          expect(newControl.isValidating).toBe(false);
          expect(newControl.error).toBe(null);
        });

        test('If promise is resolved with error should call on change and on next update create valid instance', async () => {
          const error: TControlError = {
            message: 'some error',
          };
          const validate = jest.fn().mockReturnValue(Promise.resolve(error));
          const onChange = jest.fn();

          const [control, { applyUpdate }] = createTestControl<number | undefined>({
            data: createBasic({ validate }),
            validationType: FormValidationType.always,
            onChange,
          });
          expect(control.isValid).toBe(true);
          expect(control.error).toBeNull();
          expect(control.isValidating).toBe(true);
          expect(validate).toHaveBeenCalled();
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({})!;
          expect(newControl).not.toBe(null);
          expect(newControl.isValidating).toBe(false);
          expect(newControl.error).toBe(error);
        });
      });
    });
  });
});
