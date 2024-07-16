import { TControlValue } from '../../../TControlValue';
import { TControlNames, createArrayChildNames } from '../../../names';
import { FormValidationType, TControlError } from '../../../validation';
import { TTestArray, createTestControl } from './utils';

describe('ControlArray.constructor', () => {
  test('Control has exact props that were passed to it`s constructor', () => {
    const value: TTestArray = ['ba', 'zi', 'n', 'ga'];
    const defaultValue: TTestArray = ['b', 'a', 'z', 'i', 'n', 'g', 'a'];

    const [control] = createTestControl<number>({ value, defaultValue });
    expect(control.value).toEqual(value);
    expect(control.defaultValue).toEqual(defaultValue);
  });

  describe('Setting isDirty property', () => {
    test('If value completely equals defaultValue isDirty must be false', () => {
      const value: TTestArray = ['bb', 'gg'];

      const [control] = createTestControl<number>({ value, defaultValue: value });
      expect(control.isDirty).toBe(false);
    });

    describe('If value partially does not equal defaultValue isDirty must be true', () => {
      test('If value partially does not equal defaultValue isDirty must be true', () => {
        const value: TTestArray = ['bb', 'gg', 'gd'];
        const defaultValue: TTestArray = ['new ' + value[0], ...value.slice(1)];

        const [control] = createTestControl<number>({ value, defaultValue });
        expect(control.isDirty).toBe(true);
      });

      test('Value is shorter than defaultValue', () => {
        const value: TTestArray = ['bb', 'gg', 'gd'];
        const defaultValue: TTestArray = [...value, 'baz'];

        const [control] = createTestControl<number>({ value, defaultValue });
        expect(control.isDirty).toBe(true);
      });

      test('Value is longer than defaultValue', () => {
        const value: TTestArray = ['bb', 'gg', 'gd'];
        const defaultValue: TTestArray = value.slice(0, -1);

        const [control] = createTestControl<number>({ value, defaultValue });
        expect(control.isDirty).toBe(true);
      });
    });

    test('If default value is undefined and value is defined but is empty array isDirty should be false', () => {
      const value: TControlValue<TTestArray> = [];

      const [control] = createTestControl<number>({ value, defaultValue: undefined });
      expect(control.isDirty).toBe(false);
    });
  });

  test('Setting name property', () => {
    const names: TControlNames = { dynamic: 'bazinga', static: 'unused' };
    const value: TTestArray = ['ba', 'zi', 'n', 'ga'];

    const [control] = createTestControl({ names, value });
    expect(control.name).toBe(names.dynamic);
    for (let index = 0; index < value.length; index++) {
      expect(control.list[index].control.name).toBe(createArrayChildNames(names, index).dynamic);
    }
  });

  describe('Setting isTouched property', () => {
    const value: TTestArray = ['baz', 'inga'];

    test('If isTouched === true should set it to true', () => {
      const isTouched = true;

      const [control] = createTestControl({ isTouched, value });
      expect(control.isTouched).toBe(isTouched);
      for (let index = 0; index < value.length; index++) {
        expect(control.list[index].control.isTouched).toBe(isTouched);
      }
    });

    test('If isTouched === false should set it to false', () => {
      const isTouched = false;

      const [control] = createTestControl({ isTouched, value });
      expect(control.isTouched).toBe(isTouched);
      for (let index = 0; index < value.length; index++) {
        expect(control.list[index].control.isTouched).toBe(isTouched);
      }
    });
  });

  describe('Initial validation', () => {
    test('With validationType "never" should not call validation', () => {
      const validate = jest.fn().mockReturnValue(null);

      const [control] = createTestControl({
        validationType: FormValidationType.never,
        arrayValidation: { validate },
        childrenValidation: { validate },
      });
      expect(control.isValid).toBe(true);
      expect(validate).not.toHaveBeenCalled();
    });

    describe('With validation type "onlyTouched"', () => {
      test('If control is not touched should not call validation', () => {
        const validate = jest.fn().mockReturnValue(null);
        const value: TTestArray = ['baz'];

        const [control] = createTestControl({
          validationType: FormValidationType.onlyTouched,
          arrayValidation: { validate },
          childrenValidation: { validate },
          value,
        });
        expect(control.isValid).toBe(true);
        expect(validate).not.toHaveBeenCalled();
      });

      test('If control is touched should call validation', () => {
        const validate = jest.fn().mockReturnValue(null);
        const value = ['bazinga'];

        const [control] = createTestControl<number>({
          arrayValidation: { validate },
          childrenValidation: { validate },
          validationType: FormValidationType.onlyTouched,
          isTouched: true,
          value,
        });
        expect(validate).toHaveBeenCalled();
        expect(control.isValid).toBe(true);
      });
    });

    describe('With validationType "always" should call validation', () => {
      test('Should use provided value and context', () => {
        const childContext = 'bazinga';
        const validateArray = jest.fn().mockReturnValue(null);
        const validateChild = jest.fn().mockReturnValue(null);
        const createDescendantsContext = jest.fn().mockReturnValue(childContext);
        const value: TTestArray = ['baz', 'in', 'ga'];
        const context = 66;

        createTestControl<number, string>({
          validationType: FormValidationType.always,
          value,
          createDescendantsContext,
          context,
          arrayValidation: { validate: validateArray, usesContext: true },
          childrenValidation: { validate: validateChild, usesContext: true },
        });
        expect(validateArray).toHaveBeenCalledWith(value, context);
        expect(createDescendantsContext).toHaveBeenCalledWith(value, context);
        for (let index = 0; index < value.length; index++) {
          expect(validateChild).toHaveBeenCalledWith(value[index], childContext);
        }
      });

      describe('With synchronous validation', () => {
        test('If validation for array returns null should put it to control.error and set isValid as true', () => {
          const validate = jest.fn().mockReturnValue(null);

          const [control] = createTestControl<number>({
            arrayValidation: { validate },
            validationType: FormValidationType.always,
          });
          expect(control.isValid).toBe(true);
          expect(control.error).toBeNull();
          expect(validate).toHaveBeenCalled();
        });

        test('If validation for Array returns error should put it to control.error and set isValid as false', () => {
          const error: TControlError = {
            message: 'Something wrong here',
          };
          const validate = jest.fn().mockReturnValue(error);

          const [control] = createTestControl<number>({
            arrayValidation: { validate },
            validationType: FormValidationType.always,
          });
          expect(control.isValid).toBe(false);
          expect(control.error).toBe(error);
          expect(validate).toHaveBeenCalled();
        });

        test('If validation for child prop returns error should set isValid as false', () => {
          const error: TControlError = {
            message: 'Something wrong here',
          };
          const value: TTestArray = ['baz', 'in', 'ga'];
          const validate = jest.fn().mockImplementation((item) => (item === value[1] ? error : null));

          const [control] = createTestControl({
            childrenValidation: { validate },
            validationType: FormValidationType.always,
            value,
          });
          expect(control.isValid).toBe(false);
          expect(control.error).toBe(null);
          expect(validate).toHaveBeenCalled();
        });
      });

      describe('If validation returns promise should set isValidating = true until promise is resolved', () => {
        test('If promise is resolved with null should call on change and on next update create valid instance', async () => {
          const validate = jest.fn().mockReturnValue(Promise.resolve(null));
          const onChange = jest.fn();

          const [control, { applyUpdate }] = createTestControl({
            arrayValidation: { validate },
            validationType: FormValidationType.always,
            onChange,
          });
          expect(control.isValid).toBe(true);
          expect(control.error).toBeNull();
          expect(control.isValidating).toBe(true);
          expect(validate).toHaveBeenCalled();
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({});
          expect(newControl).not.toBe(null);
          expect(newControl!.isValidating).toBe(false);
          expect(control.error).toBe(null);
        });

        test('If child validation promise is resolved with null should call on change and on next update create valid instance', async () => {
          const validate = jest.fn().mockImplementation(() => Promise.resolve(null));
          const onChange = jest.fn();
          const value: TTestArray = ['1'];

          const [control, { applyUpdate }] = createTestControl<number>({
            childrenValidation: { validate },
            validationType: FormValidationType.always,
            value,
            onChange,
          });
          expect(validate).toHaveBeenCalled();
          expect(control.isValidating).toBe(true);
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({
            childrenUpdates: {
              changed: new Map([[0, {}]]),
            },
          });
          expect(newControl).not.toBe(null);
          expect(newControl!.isValidating).toBe(false);
          expect(control.isValid).toBe(true);
        });

        test('If promise is resolved with error should call on change and on next update create valid instance', async () => {
          const error: TControlError = {
            message: 'some error',
          };
          const validate = jest.fn().mockReturnValue(Promise.resolve(error));
          const onChange = jest.fn();

          const [control, { applyUpdate }] = createTestControl<number>({
            arrayValidation: { validate },
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

        test('If child validation promise is resolved with error should call on change and on next update create invalid instance', async () => {
          const validatingChild = 1;
          const value = ['0', '65', '42'];
          const onChange = jest.fn();
          const validate = jest
            .fn()
            .mockImplementation((val) =>
              val === value[validatingChild] ? Promise.resolve({ message: 'string' }) : null
            );

          const [control, { applyUpdate }] = createTestControl<number>({
            childrenValidation: { validate },
            validationType: FormValidationType.always,
            onChange,
            value,
          });
          expect(control.isValidating).toBe(true);
          expect(validate).toHaveBeenCalled();
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({ childrenUpdates: { changed: new Map([[validatingChild, {}]]) } })!;
          expect(newControl).not.toBe(null);
          expect(newControl.isValidating).toBe(false);
          expect(newControl.isValid).toBe(false);
        });
      });
    });
  });
});
