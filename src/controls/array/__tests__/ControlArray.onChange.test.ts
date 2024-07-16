import { TControlNames, createArrayChildNames } from '../../../names';
import { TControlUpdateData } from '../../../types';
import { FormValidationType, TControlError } from '../../../validation';
import { ControlArray } from '../ControlArray';
import { TArrayExtraUpdateProps } from '../TArrayExtraUpdateProps';
import { TTestArray, createTestControl } from './utils';

type IChanges = TControlUpdateData<TTestArray> & TArrayExtraUpdateProps<TTestArray>;

describe('ControlArray.onChange', () => {
  describe('If value is provided', () => {
    test('If value as same as before should return null', () => {
      const value: TTestArray = ['baz', 'in', 'ga'];
      const [, { applyUpdate }] = createTestControl({ value });
      const updateData: IChanges = {
        value,
        childrenUpdates: {
          changed: new Map(value.map((item, index) => [index, { value: item }])),
        },
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If value is different from before should create new instance', () => {
      const differentIndex = 1;
      const value = ['baz', 'in', 'ga'];
      const newValue: TTestArray = value.slice();
      newValue[differentIndex] = 'new ' + value[differentIndex];
      const [control, { applyUpdate }] = createTestControl({ value });
      const updateData: IChanges = {
        value: newValue,
        childrenUpdates: {
          changed: new Map([[differentIndex, { value: newValue[differentIndex] }]]),
        },
      };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      for (let index = 0; index < newValue.length; index++) {
        if (index === differentIndex) {
          expect(newControl.list[index]).not.toBe(control.list[index]);
          expect(newControl.list[index].control).not.toBe(control.list[index].control);
        } else {
          expect(newControl.list[index].control).toBe(control.list[index].control);
        }
      }
    });

    test('If none of children controls use context should not create descendantsContext', () => {
      const differentIndex = 4;
      const value: TTestArray = 'bazinga'.split('');
      const newValue = value.slice();
      newValue[differentIndex] = 'new ' + value[differentIndex];
      const createDescendantsContext = jest.fn();
      const [, { applyUpdate }] = createTestControl({ value, createDescendantsContext });
      const updateData: IChanges = {
        value,
        childrenUpdates: {
          changed: new Map([[differentIndex, { value: newValue[differentIndex] }]]),
        },
      };
      createDescendantsContext.mockClear();

      applyUpdate(updateData)!;
      expect(createDescendantsContext).not.toHaveBeenCalled();
    });

    describe('If some children were added should provide correct value and defaultValue for them', () => {
      test('If value is not empty', () => {
        const defaultValue: TTestArray = '01234567'.split('');
        const value = defaultValue.slice(0, -2);
        const newValue = defaultValue.concat(['8']);
        const [, { applyUpdate }] = createTestControl({ value, defaultValue });
        const updateData: IChanges = {
          value: newValue,
          childrenUpdates: {
            added: new Map([[value.length - 1, { before: [], after: newValue.slice(-3) }]]),
          },
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        for (let index = value.length; index < newValue.length; index++) {
          expect(newControl.list[index].control.defaultValue).toBe(defaultValue[index]);
          expect(newControl.list[index].control.value).toBe(newValue[index]);
        }
      });

      test('If value is empty', () => {
        const defaultValue: TTestArray = '01'.split('');
        const value: TTestArray = [];
        const newValue = defaultValue.concat('2');
        const [, { applyUpdate }] = createTestControl({ value, defaultValue });
        const updateData: IChanges = {
          value: newValue,
          childrenUpdates: {
            added: new Map([[0, { before: [], after: newValue }]]),
          },
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        for (let index = 0; index < newValue.length; index++) {
          expect(newControl.list[index].control.defaultValue).toBe(defaultValue[index]);
          expect(newControl.list[index].control.value).toBe(newValue[index]);
        }
      });
    });

    describe('If some items were deleted should update defaultValue and names for all subsequent items', () => {
      test('When deleting first item', () => {
        const defaultValue: TTestArray = '01234567'.split('');
        const value = defaultValue.slice().reverse();
        const newValue = value.slice(1);
        const names: TControlNames = {
          dynamic: 'some-dynamic-name',
          static: 'some-static-name',
        };
        const [, { applyUpdate }] = createTestControl({ value, defaultValue, names });
        const updateData: IChanges = {
          value: newValue,
          childrenUpdates: {
            deleted: new Set([0]),
          },
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.list.length).toBe(newValue.length);
        for (let index = 0; index < newControl.list.length; index++) {
          expect(newControl.list[index].control.name).toBe(
            createArrayChildNames(names, index).dynamic
          );
          expect(newControl.list[index].control.value).toBe(newValue[index]);
          expect(newControl.list[index].control.defaultValue).toBe(defaultValue[index]);
        }
      });

      test('When deleting several items', () => {
        const defaultValue: TTestArray = '01234567'.split('');
        const value = defaultValue.slice().reverse();
        const indexesToDelete = [6, 4, 2];
        const newValue = value.slice();
        indexesToDelete.forEach((index) => newValue.splice(index, 1));
        const names: TControlNames = {
          dynamic: 'some-dynamic-name',
          static: 'some-static-name',
        };
        const [, { applyUpdate }] = createTestControl({ value, defaultValue, names });
        const updateData: IChanges = {
          value: newValue,
          childrenUpdates: {
            deleted: new Set(indexesToDelete),
          },
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.list.length).toBe(newValue.length);
        for (let index = 0; index < newControl.list.length; index++) {
          expect(newControl.list[index].control.name).toBe(
            createArrayChildNames(names, index).dynamic
          );
          expect(newControl.list[index].control.value).toBe(newValue[index]);
          expect(newControl.list[index].control.defaultValue).toBe(defaultValue[index]);
        }
      });

      test('After applying delete of item on subsequent child update should call onChange with correct index', () => {
        const value: TTestArray = '01234567'.split('');
        const newValue = value.slice(1);
        const onChange = jest.fn();
        const changedIndex = 4;
        const newChildValue = 'some new value';
        const [, { applyUpdate }] = createTestControl({ value, onChange, isTouched: true });
        const updateData: IChanges = {
          value: newValue,
          childrenUpdates: {
            deleted: new Set([0]),
          },
        };
        const expectedUpdate: IChanges = {
          value: [...newValue.slice(0, changedIndex), newChildValue, ...newValue.slice(changedIndex + 1)],
          childrenUpdates: {
            changed: new Map([[changedIndex, { value: newChildValue }]]),
          },
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        newControl.list[changedIndex].control.setValue(newChildValue);
        expect(onChange).toHaveBeenCalledWith(expectedUpdate);
      });
    });

    test('If applying all types of value update at once all list items should have correct name, value and defaultValue', () => {
      const defaultValue: TTestArray = '01234567'.split('');
      const value = defaultValue.slice().reverse();
      const indexesToDelete = [6, 4, 2];
      const indexesToChange = [1, 3, 5];
      const valuesToAdd = ['baz', 'in', 'ga'];
      const newValue = value.slice();
      indexesToChange.forEach((index) => (newValue[index] = 'new ' + newValue[index]));
      indexesToDelete.forEach((index) => newValue.splice(index, 1));
      newValue.push(...valuesToAdd);
      const names: TControlNames = {
        dynamic: 'some-dynamic-name',
        static: 'some-static-name',
      };
      const [, { applyUpdate }] = createTestControl({ value, defaultValue, names });
      const updateData: IChanges = {
        value: newValue,
        childrenUpdates: {
          added: new Map([[value.length - 1, { before: [], after: valuesToAdd }]]),
          changed: new Map(indexesToChange.map((index) => [index, { value: 'new ' + value[index] }])),
          deleted: new Set(indexesToDelete),
        },
      };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      expect(newControl.list.length).toBe(newValue.length);
      for (let index = 0; index < newControl.list.length; index++) {
        expect(newControl.list[index].control.name).toBe(
          createArrayChildNames(names, index).dynamic
        );
        expect(newControl.list[index].control.value).toBe(newValue[index]);
        expect(newControl.list[index].control.defaultValue).toBe(defaultValue[index]);
      }
    });
  });

  describe('If defaultValue is provided', () => {
    test('If defaultValue is same as before should return null', () => {
      const defaultValue: TTestArray = 'bazinga'.split('');
      const [, { applyUpdate }] = createTestControl({ defaultValue });
      const updateData: IChanges = {
        defaultValue,
      };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    test('If defaultValue is different from before should create new instance', () => {
      const defaultValue: TTestArray = 'bazinger'.split('');
      const value: TTestArray = defaultValue.map((item) => 'new ' + item);
      const newDefaultValue = defaultValue.slice().reverse();
      const [control, { applyUpdate }] = createTestControl({ defaultValue, value });
      const updateData: IChanges = {
        defaultValue: newDefaultValue,
      };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      expect(newControl.defaultValue).toEqual(newDefaultValue);
      for (let index = 0; index < value.length; index++) {
        expect(newControl.list[index].control.defaultValue).toBe(newDefaultValue[index]);
        expect(newControl.list[index].control).not.toBe(control.list[index].control);
      }
    });
  });

  describe('If context is provided', () => {
    test('If context is same as before should return null and not call validation or descendants context factory', () => {
      const context = 'bzinga';
      const validate = jest.fn().mockReturnValue(null);
      const createDescendantsContext = jest.fn().mockReturnValue(1);
      const [, { applyUpdate }] = createTestControl<string, number>({
        context,
        arrayValidation: { validate, usesContext: true },
        createDescendantsContext,
      });
      const updateData: IChanges = { context };
      validate.mockClear();

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
      expect(validate).not.toHaveBeenCalled();
    });

    describe('If context is different from before should call validation', () => {
      test('If validation result for array is different should return new instance', () => {
        const context = 'bazinga';
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: usedContext }));
        const [control, { applyUpdate }] = createTestControl({
          context,
          arrayValidation: { validate, usesContext: true },
        });
        const updateData: IChanges = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(validate).toHaveBeenCalledWith(control.value, updateData.context!);
        expect(newControl.error).toEqual({ message: updateData.context! });
      });

      test('If validation result for child is different should return new instance', () => {
        const context = 'bzinga';
        const value = 'bazinga'.split('');
        const validate = jest
          .fn()
          .mockImplementation((_val, usedContext): TControlError => ({ message: usedContext }));
        const [, { applyUpdate }] = createTestControl<string>({
          context,
          childrenValidation: { validate, usesContext: true },
          needContextForDescendantsContext: true,
          value,
        });
        const updateData: IChanges = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        for (let index = 0; index < value.length; index++) {
          expect(validate).toHaveBeenCalledWith(value[index], updateData.context!);
        }
        expect(newControl.error).toBe(null);
      });

      test('If validation result is same as before should return null', () => {
        const context = 'bzinga';
        const value = 'bazinga'.split('');
        const validate = jest
          .fn()
          .mockImplementation((_val): TControlError => ({ message: 'same old error' }));
        const [, { applyUpdate }] = createTestControl<string>({
          context,
          childrenValidation: { validate, usesContext: true },
          needContextForDescendantsContext: true,
          value,
        });
        const updateData: IChanges = { context: 'new ' + context };
        validate.mockClear();

        const newControl = applyUpdate(updateData);
        expect(newControl).toBe(null);
        for (let index = 0; index < value.length; index++) {
          expect(validate).toHaveBeenCalledWith(value[index], updateData.context!);
        }
      });

      test('If validation result is same as before should use new context for next validation', () => {
        const context = 'bazinga';
        const newContext = 'new ' + context;
        const value = 'bazinger'.split('');
        const newValue = value.slice().reverse();
        const validate = jest
          .fn()
          .mockImplementation((_val): TControlError => ({ message: 'same old error' }));
        const [, callbacks] = createTestControl<string>({
          arrayValidation: { validate, usesContext: true },
          context,
          value,
        });
        const updateData: TControlUpdateData<TTestArray> = { context: newContext };

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
        const value: TTestArray = 'bazinga'.split('');
        const createDescendantsContext = jest.fn().mockImplementation((_val, currentContext) => {
          return currentContext === context ? descendantsContext : newDescendantsContext;
        });
        const [, { applyUpdate }] = createTestControl<string, number>({
          context,
          createDescendantsContext,
          needContextForDescendantsContext: true,
          childrenValidation: { validate: validateChild, usesContext: true },
          value,
        });
        const updateData: IChanges = { context: 'new ' + context };
        validateChild.mockClear();

        const newControl = applyUpdate(updateData)!;
        expect(createDescendantsContext).toHaveBeenCalledWith(value, context);
        expect(newControl).not.toBe(null);
        for (let index = 0; index < value.length; index++) {
          expect(validateChild).toHaveBeenCalledWith(value[index], newDescendantsContext);
        }
      });

      test('If context is same as before should not create new descendants context', () => {
        const context = 'bazinga';
        const descendantsContext = 1;
        const newDescendantsContext = 2;
        const validateChild = jest.fn().mockReturnValue(null);
        const value: TTestArray = 'bazinga'.split('');
        const createDescendantsContext = jest
          .fn()
          .mockImplementation((_val, currentContext) =>
            currentContext === context ? descendantsContext : newDescendantsContext
          );
        const [, { applyUpdate }] = createTestControl<string, number>({
          context,
          createDescendantsContext,
          childrenValidation: { validate: validateChild, usesContext: true },
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
        const value: TTestArray = 'bazinga'.split('');
        const createDescendantsContext = jest.fn().mockReturnValue(descendantsContext);
        const [, { applyUpdate }] = createTestControl<string, number>({
          context,
          createDescendantsContext,
          childrenValidation: { validate: validateChild, usesContext: true },
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
      const updateData: TControlUpdateData<TTestArray> = { isTouched };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    describe('If isTouched is different from before', () => {
      test('Should create new instance', () => {
        const isTouched = true;
        const newIsTouched = !isTouched;
        const value: TTestArray = 'bazinga'.split('');
        const [, { applyUpdate }] = createTestControl({ isTouched, value });
        const updateData: TControlUpdateData<TTestArray> = { isTouched: newIsTouched };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.isTouched).toBe(newIsTouched);
        for (let index = 0; index < value.length; index++) {
          expect(newControl.list[index].control.isTouched).toBe(newIsTouched);
        }
      });

      test('If new isTouched == true and validationType == "onlyTouched" should call validation', () => {
        const isTouched = false;
        const validate = jest.fn().mockReturnValue(null);
        const value: TTestArray = 'bazinga'.split('');
        const newIsTouched = !isTouched;
        const [, { applyUpdate }] = createTestControl<string>({ arrayValidation: { validate }, isTouched, value });
        const updateData: TControlUpdateData<TTestArray> = { isTouched: newIsTouched };

        const newControl = applyUpdate(updateData)!;
        expect(newControl.isTouched).toBe(newIsTouched);
        expect(validate).toHaveBeenCalled();
      });
    });
  });

  describe('If names are provided', () => {
    const value: TTestArray = 'bazinga'.split('');

    test('If names are the same as before should not create new instance', () => {
      const names: TControlNames = {
        dynamic: 'dynamic',
        static: 'static',
      };
      const [, { applyUpdate }] = createTestControl<string>({ names, value });
      const updateData: TControlUpdateData<TTestArray> = { names };

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
      const [, { applyUpdate }] = createTestControl<string>({ names, value });
      const updateData: TControlUpdateData<TTestArray> = { names: newNames };

      const newControl = applyUpdate(updateData)!;
      expect(newControl).not.toBe(null);
      expect(newControl.name).toBe(newNames.dynamic);
      for (let index = 0; index < value.length; index++) {
        expect(newControl.list[index].control.name).toBe(
          createArrayChildNames(newNames, index).dynamic
        );
      }
    });
  });

  describe('If validationType is provided', () => {
    const value: TTestArray = 'bazinga'.split('');

    test('If type is same as before should return null', () => {
      const validationType = FormValidationType.always;
      const [, { applyUpdate }] = createTestControl({ validationType, value });
      const updateData: TControlUpdateData<TTestArray> = { validationType };

      const newControl = applyUpdate(updateData);
      expect(newControl).toBe(null);
    });

    describe('If type is different from before', () => {
      describe('Changing from "never" to "onlyTouched"', () => {
        const validationType = FormValidationType.never;
        const updateData: TControlUpdateData<TTestArray> = {
          validationType: FormValidationType.onlyTouched,
        };

        test('If control.isTouched == false should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl({
            value,
            arrayValidation: { validate },
            childrenValidation: { validate },
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
              value,
              arrayValidation: { validate },
              childrenValidation: { validate: validateChild },
              validationType,
              isTouched: true,
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
              value,
              arrayValidation: { validate },
              childrenValidation: { validate: validateChild },
              validationType,
              isTouched: true,
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
        const updateData: TControlUpdateData<TTestArray> = {
          validationType: FormValidationType.always,
        };

        test('If validation returns null should not create new instance', () => {
          const [, { applyUpdate }] = createTestControl({ value, validationType });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
        });

        test('If validation returns error should create new instance', () => {
          const error: TControlError = { message: 'some error' };
          const validate = jest.fn().mockReturnValue(error);
          const [, { applyUpdate }] = createTestControl({ value, arrayValidation: { validate }, validationType });

          const newControl = applyUpdate(updateData)!;
          expect(newControl).not.toBe(null);
          expect(newControl.error).toBe(error);
        });
      });

      describe('Changing from "onlyTouched" to "never"', () => {
        const validationType = FormValidationType.onlyTouched;
        const updateData: TControlUpdateData<TTestArray> = {
          validationType: FormValidationType.never,
        };

        test('If control.isTouched == false should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string>({
            value,
            arrayValidation: { validate },
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
              value,
              arrayValidation: { validate },
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
              value,
              arrayValidation: { validate },
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
        const updateData: TControlUpdateData<TTestArray> = {
          validationType: FormValidationType.always,
        };

        test('If control.isTouched == true should return null without calling validation', () => {
          const validate = jest.fn().mockReturnValue(null);
          const [, { applyUpdate }] = createTestControl<string>({
            value,
            arrayValidation: { validate },
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
              value,
              arrayValidation: { validate },
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
              value,
              arrayValidation: { validate },
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
        const updateData: TControlUpdateData<TTestArray> = {
          validationType: FormValidationType.never,
        };

        test('If validation returned null should not create new instance', () => {
          const [, { applyUpdate }] = createTestControl({ value, validationType });

          const newControl = applyUpdate(updateData);
          expect(newControl).toBe(null);
        });

        test('If validation returned error should create new instance', () => {
          const error: TControlError = { message: 'some error' };
          const validate = jest.fn().mockReturnValue(error);
          const [, { applyUpdate }] = createTestControl<string>({
            value,
            arrayValidation: { validate },
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

    const value: TTestArray = 'bazinger'.split('');
    const newValue = value.slice().reverse();

    test('Without delay should call for validation immediately and call another onChange after promise resolve', async () => {
      const onChange = jest.fn();
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue[0] === value[0] ? null : Promise.resolve(null)));
      const [, { applyUpdate }] = createTestControl({
        arrayValidation: { validate },
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      const newControl = applyUpdate({
        value: newValue,
        childrenUpdates: {
          changed: new Map(newValue.map((item, index) => [index, { value: item }])),
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
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue[0] === value[0] ? null : Promise.resolve(null)));
      const validationDebounceMs = 100;
      const [, { applyUpdate }] = createTestControl<number>({
        arrayValidation: { validate, validationDebounceMs },
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
      const values = [2, 3, 4, 5, 6].map((id) => value.map((item) => item + id));
      const validate = jest
        .fn()
        .mockImplementation((currentValue) => (currentValue[0] === value[0] ? null : Promise.resolve(null)));
      const validationDebounceMs = 100;
      const [, callbacks] = createTestControl<number>({
        arrayValidation: { validate, validationDebounceMs },
        value,
        onChange,
        validationType: FormValidationType.always,
      });
      validate.mockClear();

      let control!: ControlArray<TTestArray>;
      values.forEach((newValue) => {
        jest.advanceTimersByTime(validationDebounceMs - 1);
        control = callbacks.applyUpdate({
          value: newValue,
          childrenUpdates: {
            changed: new Map(newValue.map((item, index) => [index, { value: item }])),
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
      const value: string[] = Array(5)
        .fill(null)
        .map((_, index) => 'val-' + index);
      test('If provided error path fits child props', () => {
        const [control, { applyUpdate }] = createTestControl({ value });
        const childProps: Record<number, TControlError> = {
          0: { message: 'fail' },
          2: { message: 'epic fail' },
        };
        const updateData: IChanges = {
          customErrors: Object.entries(childProps).map(([key, error]) => ({ path: [key], error })),
        };

        const newControl = applyUpdate(updateData)!;
        expect(newControl).not.toBe(null);
        expect(newControl.error).toBe(null);
        for (let index = 0; index < control.list.length; index++) {
          const error = childProps[index];
          if (error) {
            expect(newControl.list[index].control.error).toEqual(error);
          } else {
            expect(newControl.list[index]).toBe(control.list[index]);
          }
        }
      });

      test('If provided error path does not fit child props', () => {
        const [, { applyUpdate }] = createTestControl({ value });
        const updateData: IChanges = {
          customErrors: [{ path: [(value.length + 5).toString(), 'missing field'], error: { message: 'message' } }],
        };

        const newControl = applyUpdate(updateData);
        expect(newControl).toBe(null);
      });
    });
  });
});
