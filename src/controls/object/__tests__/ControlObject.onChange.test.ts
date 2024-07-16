import { TControlNames, createObjectChildNames } from '../../../names';
import { TControlUpdateData } from '../../../types';
import { FormValidationType, TControlError } from '../../../validation';
import { ControlObject } from '../ControlObject';
import { TObjectExtraUpdateProps } from '../TObjectExtraUpdateProps';
import { ITestObject, createTestControl, createTestValue } from './utils';

type IChanges = TControlUpdateData<ITestObject> & TObjectExtraUpdateProps<ITestObject>;

describe('ControlObject.onChange', () => {
  describe('If value is provided', () => {
    test('If value as same as before should return null', () => {
      const value = createTestValue(0);
      const [, { applyUpdate }] = createTestControl({ value });
      const updateData: IChanges = {
        value,
        childrenUpdates: {
          id: { value: value.id },
          name: { value: value.name },
          surname: { value: value.surname },
          isAwesome: { value: value.isAwesome },
        },
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If value is different from before should create new instance', () => {
      const differentKey: keyof ITestObject = 'name';
      const value = createTestValue(2);
      const newValue: ITestObject = {
        ...value,
        [differentKey]: createTestValue(3)[differentKey],
      };
      const [control, { applyUpdate }] = createTestControl({ value });
      const updateData: IChanges = {
        value,
        childrenUpdates: {
          id: { value: newValue.id },
          name: { value: newValue.name },
          surname: { value: newValue.surname },
          isAwesome: { value: newValue.isAwesome },
        },
      };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      for (let keyStr in newValue) {
        const key = keyStr as keyof ITestObject;
        if (key === differentKey) {
          expect(newControl.fields[key]).not.toBe(control.fields[key]);
        } else {
          expect(newControl.fields[key]).toBe(control.fields[key]);
        }
      }
    });

    test('If none of children controls use context should not create descendantsContext', () => {
      const differentKey: keyof ITestObject = 'name';
      const value = createTestValue(2);
      const newValue: ITestObject = {
        ...value,
        [differentKey]: createTestValue(3)[differentKey],
      };
      const createDescendantsContext = jest.fn();
      const [, { applyUpdate }] = createTestControl({ value, createDescendantsContext });
      const updateData: IChanges = {
        value,
        childrenUpdates: {
          id: { value: newValue.id },
          name: { value: newValue.name },
          surname: { value: newValue.surname },
          isAwesome: { value: newValue.isAwesome },
        },
      };
      createDescendantsContext.mockClear();

      applyUpdate(updateData)!;
      expect(createDescendantsContext).not.toHaveBeenCalled();
    });

    test('If optional object`s value is undefined should not validate child controls', () => {
      const value = createTestValue(1);
      const noValueError: TControlError = { message: 'noValue' };
      const validate = jest.fn().mockReturnValue(null);
      const [, { applyUpdate }] = createTestControl({
        value,
        validationType: FormValidationType.always,
        isRequired: false,
        childrenValidation: {
          id: { noValueError, validate },
          name: { noValueError, validate },
          surname: { noValueError, validate },
          isAwesome: { noValueError, validate },
        },
      });
      validate.mockClear();
      const updateData: IChanges = {
        value: undefined,
        childrenUpdates: {
          id: { value: undefined },
          name: { value: undefined },
          surname: { value: undefined },
          isAwesome: { value: undefined },
        },
      };

      const result = applyUpdate(updateData)!;
      expect(result).not.toBe(null);
      expect(validate).not.toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });

    test('If required object`s value is undefined should validate child controls', () => {
      const value = createTestValue(1);
      const error: TControlError = { message: 'noValue' };
      const validate = jest.fn().mockReturnValue(error);
      const [, { applyUpdate }] = createTestControl({
        value,
        validationType: FormValidationType.always,
        isRequired: true,
        childrenValidation: {
          id: { validate },
          name: { validate },
          surname: { validate },
          isAwesome: { validate },
        },
      });
      validate.mockClear();
      const updateData: IChanges = {
        value: undefined,
        childrenUpdates: {
          id: { value: undefined },
          name: { value: undefined },
          surname: { value: undefined },
          isAwesome: { value: undefined },
        },
      };

      const result = applyUpdate(updateData)!;
      expect(result).not.toBe(null);
      for (const key in value) {
        expect(validate).toHaveBeenCalledWith(undefined, null);
      }
      expect(result.isValid).toBe(false);
    });
  });

  describe('If defaultValue is provided', () => {
    test('If defaultValue is same as before should return null', () => {
      const defaultValue = createTestValue(1);
      const [, { applyUpdate }] = createTestControl({ defaultValue });
      const updateData: IChanges = {
        defaultValue,
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If defaultValue is different from before should create new instance', () => {
      const defaultValue = createTestValue(1);
      const newDefaultValue = createTestValue(2);
      const [control, { applyUpdate }] = createTestControl({ defaultValue });
      const updateData: IChanges = {
        defaultValue: newDefaultValue,
      };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      expect(newControl.defaultValue).toEqual(newDefaultValue);
      for (const key in newDefaultValue) {
        const childControl = newControl.fields[key as keyof ITestObject];
        expect(childControl.defaultValue).toBe(newDefaultValue[key as keyof ITestObject]);
        expect(childControl).not.toBe(control.fields[key as keyof ITestObject]);
      }
    });
  });

  describe('If context is provided', () => {
    test('If context is same as before should return null and not call validation or descendants context factory', () => {
      const context = 'bazinga';
      const validate = jest.fn().mockReturnValue(null);
      const createDescendantsContext = jest.fn().mockReturnValue(1);
      const [, { applyUpdate }] = createTestControl<string, number>({
        context,
        objectValidation: { validate, usesContext: true },
        createDescendantsContext,
        childrenValidation: {
          id: { validate },
          name: { validate },
          surname: { validate },
          isAwesome: { validate },
        },
      });
      const updateData: IChanges = { context };
      validate.mockClear();

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
      expect(validate).not.toHaveBeenCalled();
    });

    describe('If context is different from before should call validation', () => {
      test('If validation result for object is different should return new instance', () => {
        const context = 'bazinga';
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: usedContext }));
        const [control, { applyUpdate }] = createTestControl({
          context,
          objectValidation: { validate, usesContext: true },
        });
        const updateData: IChanges = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(validate).toHaveBeenCalledWith(control.value, updateData.context!);
        expect(newControl.error).toEqual({ message: updateData.context! });
      });

      test('If validation result for child is different should return new instance', () => {
        const context = 'bazinga';
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: usedContext }));
        const [, { applyUpdate }] = createTestControl<string>({
          context,
          childrenValidation: { id: { validate, usesContext: true } },
          needContextForDescendantsContext: true,
          isRequired: true,
        });
        const updateData: IChanges = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(validate).toHaveBeenCalledWith(undefined, updateData.context!);
        // expect(newControl.error).toBe(null);
      });

      test('If validation result is same as before should return null', () => {
        const context = 'bazinga';
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: 'same old error' }));
        const [control, { applyUpdate }] = createTestControl<typeof context>({
          context,
          objectValidation: { usesContext: true, validate },
        });
        const updateData: TControlUpdateData<ITestObject> = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).toBe(null);
        expect(validate).toHaveBeenCalledWith(control.value, updateData.context!);
      });

      test('If validation result is same as before should use new context for next validation', () => {
        const context = 'bazinga';
        const newContext = 'new ' + context;
        const value = createTestValue(1);
        const newValue = createTestValue(2);
        const validate = jest
          .fn()
          .mockImplementation((_val): TControlError => ({ message: 'same old error' }));
        const [, callbacks] = createTestControl<string>({
          objectValidation: { validate, usesContext: true },
          context,
          value,
        });
        const updateData: TControlUpdateData<ITestObject> = { context: newContext };

        callbacks.applyUpdate(updateData)!;
        validate.mockClear();
        callbacks.applyUpdate({ value: newValue });
        expect(validate).toHaveBeenCalledWith(newValue, newContext);
      });

      test('If context is different from before should create new descendants context', () => {
        const context = 'bazinga';
        const descendantsContext = 1;
        const newDescendantsContext = 2;
        const error: TControlError = { message: 'err' };
        const validateChild = jest.fn().mockImplementation((_val, currentContext) => {
          return currentContext === descendantsContext ? null : error;
        });
        const validatedChild: keyof ITestObject = 'surname';
        const value = createTestValue(3);
        const createDescendantsContext = jest.fn().mockImplementation((_val, currentContext) => {
          return currentContext === context ? descendantsContext : newDescendantsContext;
        });
        const [, { applyUpdate }] = createTestControl<string, number>({
          context,
          createDescendantsContext,
          needContextForDescendantsContext: true,
          childrenValidation: {
            [validatedChild]: { validate: validateChild, usesContext: true },
          },
          value,
        });
        const updateData: IChanges = { context: 'new ' + context };
        validateChild.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(createDescendantsContext).toHaveBeenCalledWith(value, context);
        expect(newControl).not.toBe(null);
        expect(validateChild).toHaveBeenCalledWith(value[validatedChild], newDescendantsContext);
      });

      test('If context is same as before should not create new descendants context', () => {
        const context = 'bazinga';
        const descendantsContext = 1;
        const newDescendantsContext = 2;
        const validateChild = jest.fn().mockReturnValue(null);
        const validatedChild: keyof ITestObject = 'surname';
        const value = createTestValue(3);
        const createDescendantsContext = jest
          .fn()
          .mockImplementation((_val, currentContext) =>
            currentContext === context ? descendantsContext : newDescendantsContext
          );
        const [, { applyUpdate }] = createTestControl<string, number>({
          context,
          createDescendantsContext,
          childrenValidation: {
            [validatedChild]: { validate: validateChild, usesContext: true },
          },
          value,
        });
        const updateData: IChanges = { context };
        validateChild.mockClear();
        createDescendantsContext.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(createDescendantsContext).not.toHaveBeenCalled();
        expect(newControl).toBe(null);
        expect(validateChild).not.toHaveBeenCalled();
      });

      test('If context is not used to create descendantsContext should not create descendantsContext on context change', () => {
        const context = 'bazinga';
        const newContext = 'new bazinga';
        const descendantsContext = 1;
        const validateChild = jest.fn().mockReturnValue(null);
        const validatedChild: keyof ITestObject = 'surname';
        const value = createTestValue(3);
        const createDescendantsContext = jest.fn().mockReturnValue(descendantsContext);
        const [, { applyUpdate }] = createTestControl<string, number>({
          context,
          createDescendantsContext,
          childrenValidation: {
            [validatedChild]: { validate: validateChild, usesContext: true },
          },
          value,
        });
        const updateData: IChanges = { context: newContext };
        validateChild.mockClear();
        createDescendantsContext.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(createDescendantsContext).not.toHaveBeenCalled();
        expect(newControl).toBe(null);
        expect(validateChild).not.toHaveBeenCalled();
      });
    });
  });

  describe('If isTouched is provided', () => {
    test('If isTouched is same as before should not do anything', () => {
      const isTouched = true;
      const [, { applyUpdate }] = createTestControl({ isTouched });
      const updateData: TControlUpdateData<ITestObject> = { isTouched };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    describe('If isTouched is different from before', () => {
      test('Should create new instance', () => {
        const isTouched = true;
        const newIsTouched = !isTouched;
        const [, { applyUpdate }] = createTestControl({ isTouched });
        const updateData: TControlUpdateData<ITestObject> = { isTouched: newIsTouched };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.isTouched).toBe(newIsTouched);
        for (const key in newControl.fields) {
          expect(newControl.fields[key as keyof ITestObject].isTouched).toBe(newIsTouched);
        }
      });

      test('If new isTouched == true and validationType == "onlyTouched" should call validation', () => {
        const isTouched = false;
        const validate = jest.fn().mockReturnValue(null);
        const [, { applyUpdate }] = createTestControl<string>({ objectValidation: { validate }, isTouched });
        const updateData: TControlUpdateData<ITestObject> = {
          childrenUpdates: { id: { isTouched: true } },
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl.isTouched).toBe(!isTouched);
        expect(validate).toHaveBeenCalled();
      });
    });
  });

  describe('If names are provided', () => {
    test('If names are the same as before should not create new instance', () => {
      const names: TControlNames = {
        dynamic: 'dynamic',
        static: 'static',
      };
      const [, { applyUpdate }] = createTestControl<string>({ names });
      const updateData: TControlUpdateData<ITestObject> = { names };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If names are different from before should create new instance for each child', () => {
      const names: TControlNames = {
        dynamic: 'dynamic',
        static: 'static',
      };
      const newNames: TControlNames = {
        dynamic: 'new-name-dynamic',
        static: 'new-name-static',
      };
      const [, { applyUpdate }] = createTestControl<string>({ names });
      const updateData: TControlUpdateData<ITestObject> = { names: newNames };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      expect(newControl.name).toBe(newNames.dynamic);
      for (const key in newControl.fields) {
        expect(newControl.fields[key as keyof ITestObject].name).toBe(
          createObjectChildNames(newNames, key).dynamic
        );
      }
    });
  });

  describe('If validationType is provided', () => {
    test('If type is same as before should return null', () => {
      const validationType = FormValidationType.never;
      const [, { applyUpdate }] = createTestControl({ validationType });
      const updateData: TControlUpdateData<ITestObject> = { validationType };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    describe('If type is different from before', () => {
      describe('Changing from "never" to "onlyTouched"', () => {
        const validationType = FormValidationType.never;
        const updateData: TControlUpdateData<ITestObject> = {
          validationType: FormValidationType.onlyTouched,
        };

        test('If control.isTouched == false should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl({
            objectValidation: { validate },
            childrenValidation: { id: { validate } },
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
            const validateChild = jest.fn().mockReturnValue(null);
            const [, { applyUpdate }] = createTestControl({
              objectValidation: { validate },
              childrenValidation: { id: { validate: validateChild } },
              value: createTestValue(3),
              validationType,
              isTouched: true,
              isRequired: true,
            });

            const newControl = applyUpdate(updateData);
            expect(newControl).toBe(null);
            expect(validate).toHaveBeenCalled();
            expect(validateChild).toHaveBeenCalled();
          });

          test('If validation returns error should create new instance', () => {
            const error: TControlError = { message: 'bazinga' };
            const validate = jest.fn().mockReturnValue(error);
            const validateChild = jest.fn().mockReturnValue(null);
            const [, { applyUpdate }] = createTestControl({
              objectValidation: { validate },
              childrenValidation: { id: { validate: validateChild } },
              value: createTestValue(4),
              validationType,
              isTouched: true,
              isRequired: true,
            });

            const newControl = applyUpdate(updateData)!;
            expect(newControl).not.toBe(null)!;
            expect(validate).toHaveBeenCalled();
            expect(validateChild).toHaveBeenCalled();
            expect(newControl.error).toBe(error);
          });
        });
      });

      describe('Changing from "never" to "always"', () => {
        const validationType = FormValidationType.never;
        const updateData: TControlUpdateData<ITestObject> = {
          validationType: FormValidationType.always,
        };

        test('If validation returns null should not create new instance', () => {
          const [, { applyUpdate }] = createTestControl({ validationType });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
        });

        test('If validation returns error should create new instance', () => {
          const error: TControlError = { message: 'some error' };
          const validate = jest.fn().mockReturnValue(error);
          const [, { applyUpdate }] = createTestControl({ objectValidation: { validate }, validationType });

          const newControl = applyUpdate(updateData)!;
          expect(newControl).not.toBe(null);
          expect(newControl.error).toBe(error);
        });
      });

      describe('Changing from "onlyTouched" to "never"', () => {
        const validationType = FormValidationType.onlyTouched;
        const updateData: TControlUpdateData<ITestObject> = {
          validationType: FormValidationType.never,
        };

        test('If control.isTouched == false should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string>({
            objectValidation: { validate },
            validationType,
            isTouched: false,
          });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
          expect(validate).not.toHaveBeenCalled();
        });

        describe('If control.isTouched == true', () => {
          test('If validation returned null should not create new instance', () => {
            const validate = jest.fn().mockReturnValue(null);
            const [, { applyUpdate }] = createTestControl({
              objectValidation: { validate },
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
            const [, { applyUpdate }] = createTestControl({
              objectValidation: { validate },
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
        const updateData: TControlUpdateData<ITestObject> = {
          validationType: FormValidationType.always,
        };

        test('If control.isTouched == true should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string>({
            objectValidation: { validate },
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
            const [, { applyUpdate }] = createTestControl<string>({
              objectValidation: { validate },
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
            const [, { applyUpdate }] = createTestControl<string>({
              objectValidation: { validate },
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
        const updateData: TControlUpdateData<ITestObject> = {
          validationType: FormValidationType.never,
        };

        test('If validation returned null should not create new instance', () => {
          const [, { applyUpdate }] = createTestControl({ validationType });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
        });

        test('If validation returned error should create new instance', () => {
          const error: TControlError = { message: 'some error' };
          const validate = jest.fn().mockReturnValue(error);
          const [, { applyUpdate }] = createTestControl<string>({ objectValidation: { validate }, validationType });

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
      const value = createTestValue(1);
      const newValue = createTestValue(2);
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue.id === value.id ? null : Promise.resolve(null)));
      const [, { applyUpdate }] = createTestControl({
        objectValidation: { validate },
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      const newControl = applyUpdate({
        value: newValue,
        childrenUpdates: {
          id: { value: newValue.id },
          name: { value: newValue.name },
          surname: { value: newValue.surname },
          isAwesome: { value: newValue.isAwesome },
        },
      })!;
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
      const value = createTestValue(1);
      const newValue = createTestValue(2);
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue.id === value.id ? null : Promise.resolve(null)));
      const validationDebounceMs = 100;
      const [, { applyUpdate }] = createTestControl<number>({
        objectValidation: { validate, validationDebounceMs },
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      jest.advanceTimersByTime(validationDebounceMs);
      validate.mockClear();
      applyUpdate({})!;

      const newControl = applyUpdate({ value: newValue })!;
      expect(newControl).not.toBe(null);
      expect(validate).not.toHaveBeenCalled();
      expect(newControl.isValidating).toBe(true);
      await Promise.resolve();
      expect(validate).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      jest.advanceTimersByTime(validationDebounceMs - 1);
      expect(validate).not.toHaveBeenCalled();
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
      const value = createTestValue(1);
      const values = [2, 3, 4, 5, 6].map((id) => createTestValue(id));
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue.id === value.id ? null : Promise.resolve(null)));
      const validationDebounceMs = 100;
      const [, callbacks] = createTestControl<number>({
        objectValidation: { validate, validationDebounceMs },
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      let control!: ControlObject<ITestObject>;
      values.forEach((newValue) => {
        jest.advanceTimersByTime(validationDebounceMs - 1);
        control = callbacks.applyUpdate({
          value: newValue,
          childrenUpdates: {
            id: { value: newValue.id },
            name: { value: newValue.name },
            surname: { value: newValue.surname },
            isAwesome: { value: newValue.isAwesome },
          },
        })!;
      });
      expect(control).not.toBe(null);
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

      const [, { applyUpdate }] = createTestControl({});
      const updateData: IChanges = {
        customErrors: [{ path: [], error }],
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).not.toBe(null);
      expect(newControl!.error).toEqual(error);
    });

    test('If several errors are provided with empty paths', () => {
      const errors: TControlError[] = [
        { message: 'bazinga' },
        { message: 'bazinga2' },
        { message: 'bazinga3' },
      ];
      const [, { applyUpdate }] = createTestControl({});
      const updateData: IChanges = {
        customErrors: errors.map((error) => ({ path: [], error })),
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).not.toBe(null);
      expect(newControl!.error).toEqual(errors[0]);
    });

    describe('If provided error path is not empty', () => {
      test('If provided error path fits child props', () => {
        const [control, { applyUpdate }] = createTestControl({});
        const childProps: Partial<Record<keyof ITestObject, TControlError>> = {
          isAwesome: { message: 'not true at all' },
          surname: { message: 'that surname sounds dumb' },
        };
        const updateData: IChanges = {
          customErrors: Object.entries(childProps).map(([key, error]) => ({ path: [key], error })),
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.error).toBe(null);
        for (const keyStr in control.fields) {
          const key = keyStr as keyof ITestObject;
          const error = childProps[key];
          if (error) {
            expect(newControl.fields[key].error).toEqual(error);
          } else {
            expect(newControl.fields[key]).toBe(control.fields[key]);
          }
        }
      });

      test('If provided error path does not fit child props', () => {
        const [, { applyUpdate }] = createTestControl({});
        const updateData: IChanges = {
          customErrors: [{ path: ['some-missing-field', 'really missing'], error: { message: 'message' } }],
        };

        const newControl = applyUpdate(updateData);
        expect(newControl).toBe(null);
      });
    });
  });
});
