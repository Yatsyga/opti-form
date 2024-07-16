import { createBasic } from '../../../control-data';
import { TControlNames } from '../../../names';
import { TControlUpdateData } from '../../../types';
import { FormValidationType, TControlError } from '../../../validation';
import { ControlBasic } from '../ControlBasic';
import { createTestControl } from './utils';

describe('ControlBasic.onChange', () => {
  describe('If value is provided', () => {
    test('If value as same as before should return null', () => {
      const value = 'bazinga';
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}), value });
      const updateData: TControlUpdateData<string | undefined> = { value };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If value is different from before should create new instance', () => {
      const value = 'bazinga';
      const newValue = 'new ' + value;
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}), value });
      const updateData: TControlUpdateData<string | undefined> = { value: newValue };

      const newControl = applyUpdate(updateData);
      expect(newControl).not.toBe(null);
    });
  });

  describe('If defaultValue is provided', () => {
    test('If defaultValue as same as before should return null', () => {
      const defaultValue = 'bazinga';
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}), defaultValue });
      const updateData: TControlUpdateData<string | undefined> = { defaultValue };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If defaultValue is different from before should create new instance', () => {
      const defaultValue = 'bazinga';
      const newDefaultValue = 'new ' + defaultValue;
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}), defaultValue });
      const updateData: TControlUpdateData<string | undefined> = { defaultValue: newDefaultValue };

      const newControl = applyUpdate(updateData);
      expect(newControl).not.toBe(null);
    });
  });

  describe('If context is provided', () => {
    test('If context is same as before should return null and not call validation', () => {
      const context = 'bazinga';
      const validate = jest.fn().mockReturnValue(null);
      const [, { applyUpdate }] = createTestControl<string | undefined>({
        data: createBasic({ validate, usesContext: true }),
        context,
      });
      const updateData: TControlUpdateData<string | undefined> = { context };
      validate.mockClear();

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
      expect(validate).not.toHaveBeenCalled();
    });

    describe('If context is different from before should call validation', () => {
      test('If validation result is different should return new instance', () => {
        const context = 'bazinga';
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: usedContext }));
        const [control, { applyUpdate }] = createTestControl<string | undefined>({
          data: createBasic({ validate, usesContext: true }),
          context,
        });
        const updateData: TControlUpdateData<string | undefined> = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(validate).toHaveBeenCalledWith(control.value, updateData.context!);
        expect(newControl.error).toEqual({ message: updateData.context! });
      });

      test('If validation result is same as before should return null', () => {
        const context = 'bazinga';
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: 'same old error' }));
        const [control, { applyUpdate }] = createTestControl<string | undefined>({
          data: createBasic({ validate, usesContext: true }),
          context,
        });
        const updateData: TControlUpdateData<string | undefined> = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).toBe(null);
        expect(validate).toHaveBeenCalledWith(control.value, updateData.context!);
      });

      test('If validation result is same as before should use new context for next validation', () => {
        const context = 'bazinga';
        const newContext = 'new ' + context;
        const value = 'val';
        const newValue = 'new ' + value;
        const validate = jest
          .fn()
          .mockImplementation((_val): TControlError => ({ message: 'same old error' }));
        const [, callbacks] = createTestControl<string | undefined>({
          data: createBasic({ validate, usesContext: true }),
          context,
          value,
        });
        const updateData: TControlUpdateData<string | undefined> = { context: newContext };

        callbacks.applyUpdate(updateData)!;
        validate.mockClear();
        callbacks.applyUpdate({ value: newValue });
        expect(validate).toHaveBeenCalledWith(newValue, newContext);
      });

      test('If usesContext === false should not call validation at all', () => {
        const context = 'bazinga';
        const newContext = 'new ' + context;
        const value = 'val';
        const validate = jest.fn().mockReturnValue(null);
        const [, callbacks] = createTestControl<string | undefined>({
          data: createBasic({ validate, usesContext: false }),
          context,
          value,
        });
        const updateData: TControlUpdateData<string | undefined> = { context: newContext };
        validate.mockClear();

        callbacks.applyUpdate(updateData)!;
        expect(validate).not.toHaveBeenCalled();
      });
    });
  });

  describe('If isTouched is provided', () => {
    test('If isTouched is same as before should not do anything', () => {
      const isTouched = true;
      const [control, { applyUpdate }] = createTestControl<string | undefined>({
        data: createBasic({}),
        isTouched,
      });
      const updateData: TControlUpdateData<string | undefined> = { isTouched };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    describe('If isTouched is different from before', () => {
      test('Should create new instance', () => {
        const isTouched = true;
        const newIsTouched = !isTouched;
        const [, { applyUpdate }] = createTestControl<string | undefined>({
          data: createBasic({}),
          isTouched,
        });
        const updateData: TControlUpdateData<string | undefined> = { isTouched: newIsTouched };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.isTouched).toBe(newIsTouched);
      });

      test('If new isTouched == true and validationType == "onlyTouched" should call validation', () => {
        const isTouched = false;
        const validate = jest.fn().mockReturnValue(null);
        const newIsTouched = true;
        const [, { applyUpdate }] = createTestControl<string | undefined>({
          data: createBasic({ validate }),
          isTouched,
          validationType: FormValidationType.onlyTouched,
        });
        const updateData: TControlUpdateData<string | undefined> = { isTouched: newIsTouched };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl.isTouched).toBe(newIsTouched);
        expect(validate).toHaveBeenCalled();
      });

      test('If new isTouched == false and validationType == "always" should not call validation', () => {
        const isTouched = false;
        const validate = jest.fn().mockReturnValue(null);
        const newIsTouched = !isTouched;
        const [, { applyUpdate }] = createTestControl<string | undefined>({
          data: createBasic({ validate }),
          isTouched,
          validationType: FormValidationType.always,
        });
        const updateData: TControlUpdateData<string | undefined> = { isTouched: newIsTouched };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl.isTouched).toBe(newIsTouched);
        expect(validate).not.toHaveBeenCalled();
      });
    });
  });

  describe('If names is provided', () => {
    test('If name is same as before should not create new instance', () => {
      const names: TControlNames = {
        static: 'static-name',
        dynamic: 'dynamic-name',
      };
      const [, { applyUpdate }] = createTestControl<string | undefined>({
        data: createBasic({}),
        names,
      });

      expect(applyUpdate({ names })).toBe(null);
    });

    test('If name is different from before should not create new instance', () => {
      const names: TControlNames = {
        static: 'static-name',
        dynamic: 'dynamic-name',
      };
      const newNames: TControlNames = {
        static: 'static-name-new',
        dynamic: 'dynamic-name-new',
      };
      const [, { applyUpdate }] = createTestControl<string | undefined>({
        data: createBasic({}),
        names,
      });

      const newControl = applyUpdate({ names: newNames })!;
      expect(newControl).not.toBe(null);
      expect(newControl.name).toBe(newNames.dynamic);
    });
  });

  describe('If validationType is provided', () => {
    test('If type is same as before should return null', () => {
      const validationType = FormValidationType.never;
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}), validationType });
      const updateData: TControlUpdateData<string | undefined> = { validationType };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    describe('If type is different from before', () => {
      describe('Changing from "never" to "onlyTouched"', () => {
        const validationType = FormValidationType.never;
        const updateData: TControlUpdateData<string | undefined> = {
          validationType: FormValidationType.onlyTouched,
        };

        test('If control.isTouched == false should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string | undefined>({
            data: createBasic({ validate }),
            validationType,
            isTouched: false,
          });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
          expect(validate).not.toHaveBeenCalled();
        });

        describe('If control.isTouched == true', () => {
          test('If validation returns null should not create new instance', () => {
            const validate = jest.fn().mockReturnValue(null);
            const [, { applyUpdate }] = createTestControl<string | undefined>({
              data: createBasic({ validate }),
              validationType,
              isTouched: true,
            });

            const newControl = applyUpdate(updateData);
            expect(newControl).toBe(null);
            expect(validate).toHaveBeenCalled();
          });

          test('If validation returns error should create new instance', () => {
            const error: TControlError = { message: 'bazinga' };
            const validate = jest.fn().mockReturnValue(error);
            const [, { applyUpdate }] = createTestControl<string | undefined>({
              data: createBasic({ validate }),
              validationType,
              isTouched: true,
            });

            const newControl = applyUpdate(updateData)!;
            expect(newControl).not.toBe(null)!;
            expect(validate).toHaveBeenCalled();
            expect(newControl.error).toBe(error);
          });
        });
      });

      describe('Changing from "never" to "always"', () => {
        const validationType = FormValidationType.never;
        const updateData: TControlUpdateData<string | undefined> = {
          validationType: FormValidationType.always,
        };

        test('If validation returns null should not create new instance', () => {
          const [, { applyUpdate }] = createTestControl({
            data: createBasic({}),
            validationType,
          });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
        });

        test('If validation returns error should create new instance', () => {
          const error: TControlError = { message: 'some error' };
          const validate = jest.fn().mockReturnValue(error);
          const [, { applyUpdate }] = createTestControl<string | undefined>({
            data: createBasic({ validate }),
            validationType,
          });

          const newControl = applyUpdate(updateData)!;
          expect(newControl).not.toBe(null);
          expect(newControl.error).toBe(error);
        });
      });

      describe('Changing from "onlyTouched" to "never"', () => {
        const validationType = FormValidationType.onlyTouched;
        const updateData: TControlUpdateData<string | undefined> = {
          validationType: FormValidationType.never,
        };

        test('If control.isTouched == false should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string | undefined>({
            data: createBasic({ validate }),
            validationType,
            isTouched: false,
          });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
          expect(validate).not.toHaveBeenCalled();
        });

        describe('If control.isTouched == true', () => {
          test('If initial validation returned null should not create new instance', () => {
            const validate = jest.fn().mockReturnValue(null);
            const [, { applyUpdate }] = createTestControl<string | undefined>({
              data: createBasic({ validate }),
              validationType,
              isTouched: true,
            });
            validate.mockClear();

            const newControl = applyUpdate(updateData);
            expect(newControl).toBe(null);
            expect(validate).not.toHaveBeenCalled();
          });

          test('If validation returned error should create new instance', () => {
            const error: TControlError = { message: 'bazinga' };
            const validate = jest.fn().mockReturnValue(error);
            const [, { applyUpdate }] = createTestControl<string | undefined>({
              data: createBasic({ validate }),
              validationType,
              isTouched: true,
            });

            const newControl = applyUpdate(updateData)!;
            expect(newControl).not.toBe(null)!;
            expect(validate).toHaveBeenCalled();
            expect(newControl.error).toBe(null);
          });
        });
      });

      describe('Changing from "onlyTouched" to "always"', () => {
        const validationType = FormValidationType.onlyTouched;
        const updateData: TControlUpdateData<string | undefined> = {
          validationType: FormValidationType.always,
        };

        test('If control.isTouched == true should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string | undefined>({
            data: createBasic({ validate }),
            validationType,
            isTouched: true,
          });
          validate.mockClear();

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
          expect(validate).not.toHaveBeenCalled();
        });

        describe('If control.isTouched == false', () => {
          test('If validation returned null should not create new instance', () => {
            const validate = jest.fn().mockReturnValue(null);
            const [, { applyUpdate }] = createTestControl<string | undefined>({
              data: createBasic({ validate }),
              validationType,
              isTouched: true,
            });

            const newControl = applyUpdate(updateData);
            expect(newControl).toBe(null);
            expect(validate).toHaveBeenCalled();
          });

          test('If validation returned error should create new instance', () => {
            const error: TControlError = { message: 'bazinga' };
            const validate = jest.fn().mockReturnValue(error);
            const [, { applyUpdate }] = createTestControl<string | undefined>({
              data: createBasic({ validate }),
              validationType,
              isTouched: false,
            });

            const newControl = applyUpdate(updateData)!;
            expect(newControl).not.toBe(null)!;
            expect(validate).toHaveBeenCalled();
            expect(newControl.error).toBe(error);
          });
        });
      });

      describe('Changing from "always" to "never"', () => {
        const validationType = FormValidationType.always;
        const updateData: TControlUpdateData<string | undefined> = {
          validationType: FormValidationType.never,
        };

        test('If validation returned null should not create new instance', () => {
          const [, { applyUpdate }] = createTestControl({
            data: createBasic({}),
            validationType,
          });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
        });

        test('If validation returned error should create new instance', () => {
          const error: TControlError = { message: 'some error' };
          const validate = jest.fn().mockReturnValue(error);
          const [, { applyUpdate }] = createTestControl<string | undefined>({
            data: createBasic({ validate }),
            validationType,
          });

          const newControl = applyUpdate(updateData)!;
          expect(newControl).not.toBe(null);
          expect(newControl.error).toBe(null);
        });
      });
    });
  });

  describe('Async validation', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('Without delay should call for validation immediately and call another onChange after promise resolve', async () => {
      const onChange = jest.fn();
      const value = 12;
      const newValue = value + 1;
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue === value ? null : Promise.resolve(null)));
      const [, { applyUpdate }] = createTestControl<number | undefined>({
        data: createBasic({ validate }),
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      const newControl = applyUpdate({ value: newValue })!;
      expect(newControl).not.toBe(null);
      expect(validate).toHaveBeenCalledWith(newValue, null);
      expect(newControl.isValidating).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      await Promise.resolve();
      expect(onChange).toHaveBeenCalledWith({});
      const finalControl = applyUpdate({})!;
      expect(finalControl).not.toBe(null);
      expect(finalControl.isValidating).toBe(false);
    });

    test('With delay should call for validation after specified delay and call another onChange after promise resolve', async () => {
      const onChange = jest.fn();
      const value = 12;
      const newValue = value + 1;
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue === value ? null : Promise.resolve(null)));
      const validationDebounceMs = 100;
      const [, { applyUpdate }] = createTestControl<number | undefined>({
        data: createBasic({ validate, validationDebounceMs }),
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      const newControl = applyUpdate({ value: newValue })!;
      expect(newControl).not.toBe(null);
      expect(validate).not.toHaveBeenCalled();
      expect(newControl.isValidating).toBe(true);
      await Promise.resolve();
      expect(onChange).not.toHaveBeenCalled();
      jest.advanceTimersByTime(validationDebounceMs - 1);
      expect(onChange).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(validate).toHaveBeenCalledWith(newValue, null);
      await Promise.resolve();
      expect(onChange).toHaveBeenCalledWith({});
      const finalControl = applyUpdate({})!;
      expect(finalControl).not.toBe(null);
      expect(finalControl.isValidating).toBe(false);
    });

    test('When several validations are triggered within specified debounce duration should call validation only once', async () => {
      const onChange = jest.fn();
      const value = 0;
      const values = [1, 2, 3, 4, 5];
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue === value ? null : Promise.resolve(null)));
      const validationDebounceMs = 100;
      const [, callbacks] = createTestControl<number | undefined>({
        data: createBasic({ validate, validationDebounceMs }),
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      let control!: ControlBasic<number>;
      values.forEach((newValue) => {
        jest.advanceTimersByTime(validationDebounceMs - 1);
        control = callbacks.applyUpdate({ value: newValue })!;
      });
      expect(control.isValidating).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      expect(validate).not.toHaveBeenCalled();
      jest.advanceTimersByTime(validationDebounceMs);
      expect(validate).toHaveBeenCalledWith(values[values.length - 1], null);
      expect(onChange).not.toHaveBeenCalled();
      await Promise.resolve();
      expect(onChange).toHaveBeenCalledWith({});
      const finalControl = callbacks.applyUpdate({})!;
      expect(finalControl).not.toBe(null);
      expect(finalControl.isValidating).toBe(false);
    });
  });

  describe('If custom errors was provided', () => {
    test('If single error is provided', () => {
      const error: TControlError = { message: 'bazinga' };
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}) });
      const updateData: TControlUpdateData<string | undefined> = {
        customErrors: [{ path: [], error }],
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).not.toBe(null);
      expect(newControl!.error).toEqual(error);
    });

    test('If provided error path is not empty', () => {
      const error: TControlError = { message: 'bazinga' };
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}) });
      const updateData: TControlUpdateData<string | undefined> = {
        customErrors: [{ path: ['some', 'path'], error }],
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If several errors are provided with empty paths', () => {
      const errors: TControlError[] = [
        { message: 'bazinga' },
        { message: 'bazinga2' },
        { message: 'bazinga3' },
      ];
      const [, { applyUpdate }] = createTestControl({ data: createBasic({}) });
      const updateData: TControlUpdateData<string | undefined> = {
        customErrors: errors.map((error) => ({ path: [], error })),
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).not.toBe(null);
      expect(newControl!.error).toEqual(errors[0]);
    });

    test('Should not update instance if provided custom error is the same as current error', () => {
      const error: TControlError = { message: 'bazinga' };
      const customError: TControlError = { message: error.message };
      const validate = () => error;
      const [, { applyUpdate }] = createTestControl<string | undefined>({
        data: createBasic({ validate, usesContext: true }),
        validationType: FormValidationType.always,
      });
      const updateData: TControlUpdateData<string | undefined> = {
        customErrors: [{ path: [], error: customError }],
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });
  });
});
