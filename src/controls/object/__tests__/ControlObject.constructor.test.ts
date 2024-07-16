import { TControlValue } from '../../../TControlValue';
import { TControlNames, createObjectChildNames } from '../../../names';
import { FormValidationType, TControlError } from '../../../validation';
import { ITestObject, createTestControl, createTestValue } from './utils';

describe('ControlObject.constructor', () => {
  test('Control has exact props that were passed to it`s constructor', () => {
    const value: ITestObject = {
      id: 1,
      name: '2',
      surname: '3',
      isAwesome: true,
    };
    const defaultValue: ITestObject = {
      id: 2,
      name: '3',
      surname: '4',
      isAwesome: false,
    };

    const [control] = createTestControl<number>({ value, defaultValue });
    expect(control.value).toEqual(value);
    expect(control.defaultValue).toEqual(defaultValue);
  });

  describe('Setting isDirty property', () => {
    test('If value completely equals defaultValue isDirty must be false', () => {
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };

      const [control] = createTestControl<number>({ value, defaultValue: value });
      expect(control.isDirty).toBe(false);
    });

    test('If value partially does not equal defaultValue isDirty must be true', () => {
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const defaultValue: ITestObject = {
        ...value,
        id: value.id! + 1,
      };

      const [control] = createTestControl<number>({ value, defaultValue });
      expect(control.isDirty).toBe(true);
    });

    test('If value completely does not equal defaultValue isDirty must be true', () => {
      const value: ITestObject = {
        id: 1,
        name: '2',
        surname: '3',
        isAwesome: true,
      };
      const defaultValue: ITestObject = {
        id: 2,
        name: '3',
        surname: '4',
        isAwesome: false,
      };

      const [control] = createTestControl<number>({ value, defaultValue });
      expect(control.isDirty).toBe(true);
    });

    test('If default value is undefined and value is defined but with every property undefined isDirty must be false', () => {
      const value: TControlValue<ITestObject> = {
        id: undefined,
        name: undefined,
        surname: undefined,
        isAwesome: undefined,
      };

      const [control] = createTestControl<number>({ value, defaultValue: undefined });
      expect(control.isDirty).toBe(false);
    });
  });

  test('Setting name property', () => {
    const names: TControlNames = { dynamic: 'bazinga', static: 'unused' };

    const [control] = createTestControl<number>({ names });
    expect(control.name).toBe(names.dynamic);
    for (const key in control.fields) {
      expect(control.fields[key as keyof ITestObject].name).toBe(
        createObjectChildNames(names, key).dynamic
      );
    }
  });

  describe('Setting isTouched property', () => {
    test('If isTouched === true should set it to true', () => {
      const isTouched = true;

      const [control] = createTestControl<number>({ isTouched });
      expect(control.isTouched).toBe(isTouched);
      for (const key in control.fields) {
        expect(control.fields[key as keyof ITestObject].isTouched).toBe(isTouched);
      }
    });

    test('If isTouched === false should set it to false', () => {
      const isTouched = false;

      const [control] = createTestControl<number>({ isTouched });
      expect(control.isTouched).toBe(isTouched);
      for (const key in control.fields) {
        expect(control.fields[key as keyof ITestObject].isTouched).toBe(isTouched);
      }
    });
  });

  describe('Initial validation', () => {
    test('With validationType "never" should not call validation', () => {
      const validate = jest.fn().mockReturnValue(null);

      const [control] = createTestControl({
        validationType: FormValidationType.never,
        objectValidation: { validate },
        childrenValidation: {
          id: { validate },
          isAwesome: { validate },
          name: { validate },
          surname: { validate },
        },
      });
      expect(control.isValid).toBe(true);
      expect(validate).not.toHaveBeenCalled();
    });

    describe('With validation type "onlyTouched"', () => {
      test('If control is not touched should not call validation', () => {
        const validate = jest.fn().mockReturnValue(null);

        const [control] = createTestControl<number>({
          validationType: FormValidationType.onlyTouched,
          objectValidation: { validate },
          childrenValidation: {
            id: { validate },
            isAwesome: { validate },
            name: { validate },
            surname: { validate },
          },
        });
        expect(control.isValid).toBe(true);
        expect(validate).not.toHaveBeenCalled();
      });

      test('If control is touched should call validation', () => {
        const validate = jest.fn().mockReturnValue(null);

        const [control] = createTestControl<number>({
          objectValidation: { validate },
          childrenValidation: {
            id: { validate },
            isAwesome: { validate },
            name: { validate },
            surname: { validate },
          },
          validationType: FormValidationType.onlyTouched,
          isTouched: true,
        });
        expect(validate).toHaveBeenCalled();
      });
    });

    describe('With validationType "always" should call validation', () => {
      test('Should use provided value and context', () => {
        const childContext = 'bazinga';
        const validateObject = jest.fn().mockReturnValue(null);
        const validateChild = jest.fn().mockReturnValue(null);
        const createDescendantsContext = jest.fn().mockReturnValue(childContext);
        const value: ITestObject = {
          id: 1,
          name: '2',
          surname: '3',
          isAwesome: true,
        };
        const context = 66;

        const [control] = createTestControl<number, string>({
          validationType: FormValidationType.always,
          value,
          createDescendantsContext,
          context,
          objectValidation: { validate: validateObject, usesContext: true },
          childrenValidation: {
            id: { validate: validateChild, usesContext: true },
            name: { validate: validateChild, usesContext: true },
            surname: { validate: validateChild, usesContext: true },
            isAwesome: { validate: validateChild, usesContext: true },
          },
        });
        expect(validateObject).toHaveBeenCalledWith(value, context);
        expect(createDescendantsContext).toHaveBeenCalledWith(value, context);
        for (const key in value) {
          expect(validateChild).toHaveBeenCalledWith(value[key as keyof ITestObject], childContext);
        }
      });

      describe('With synchronous validation', () => {
        test('If validation for object returns null should put it to control.error and set isValid as true', () => {
          const validate = jest.fn().mockReturnValue(null);

          const [control] = createTestControl<number>({
            objectValidation: { validate },
            childrenValidation: {
              id: { validate },
              name: { validate },
              surname: { validate },
              isAwesome: { validate },
            },
            validationType: FormValidationType.always,
          });
          expect(control.isValid).toBe(true);
          expect(control.error).toBeNull();
          expect(validate).toHaveBeenCalled();
        });

        test('If validation for object returns error should put it to control.error and set isValid as false', () => {
          const error: TControlError = {
            message: 'Something wrong here',
          };
          const validate = jest.fn().mockReturnValue(error);

          const [control] = createTestControl<number>({
            objectValidation: { validate },
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
          const wrongProp: keyof ITestObject = 'name';
          const validate = jest.fn().mockReturnValue(error);

          const [control] = createTestControl<number>({
            childrenValidation: {
              [wrongProp]: { validate },
            },
            validationType: FormValidationType.always,
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

          const [control, { applyUpdate }] = createTestControl<number>({
            objectValidation: { validate },
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
          const validate = jest.fn().mockReturnValue(Promise.resolve(null));
          const onChange = jest.fn();
          const validatingChild: keyof ITestObject = 'isAwesome';

          const [control, { applyUpdate }] = createTestControl<number>({
            childrenValidation: {
              [validatingChild]: { validate },
            },
            validationType: FormValidationType.always,
            onChange,
          });
          expect(control.isValidating).toBe(true);
          expect(validate).toHaveBeenCalled();
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({ childrenUpdates: { [validatingChild]: {} } });
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
            objectValidation: { validate },
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
          const validate = jest.fn().mockReturnValue(Promise.resolve({ message: 'string' }));
          const onChange = jest.fn();
          const validatingChild: keyof ITestObject = 'isAwesome';

          const [control, { applyUpdate }] = createTestControl<number>({
            childrenValidation: {
              [validatingChild]: { validate },
            },
            validationType: FormValidationType.always,
            onChange,
            value: createTestValue(2),
          });
          expect(control.isValidating).toBe(true);
          expect(validate).toHaveBeenCalled();
          await Promise.resolve();
          expect(onChange).toHaveBeenCalled();
          const newControl = applyUpdate({ childrenUpdates: { [validatingChild]: {} } })!;
          expect(newControl).not.toBe(null);
          expect(newControl.isValidating).toBe(false);
          expect(newControl.isValid).toBe(false);
        });
      });
    });
  });
});
