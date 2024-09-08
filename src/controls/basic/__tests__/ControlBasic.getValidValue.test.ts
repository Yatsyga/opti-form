import { createBasic } from '../../../control-data';
import { FormValidationType } from '../../../validation';
import { createTestControl } from './utils';

describe('ControlBasic.getValidValue', () => {
  describe('If validation was not called before should call it without changing instance', () => {
    describe('ValidationType === "never"', () => {
      test('No validation callback is provided', async () => {
        const value = 3;

        const [, callbacks] = createTestControl<number | undefined>({
          data: createBasic({}),
          value,
          validationType: FormValidationType.never,
        });

        expect(await callbacks.getValidValue()).toEqual([true, value]);
      });

      test('Value is valid', async () => {
        const value = 3;

        const [, callbacks] = createTestControl<number | undefined>({
          data: createBasic({
            validate: () => null,
          }),
          value,
          validationType: FormValidationType.never,
        });

        expect(await callbacks.getValidValue()).toEqual([true, value]);
      });

      test('Value is invalid', async () => {
        const value = 3;

        const [, callbacks] = createTestControl<number | undefined>({
          data: createBasic({
            validate: () => ({ message: 'bazinga' }),
          }),
          value,
          validationType: FormValidationType.never,
        });

        expect(await callbacks.getValidValue()).toEqual([false, null]);
      });
    });

    describe('ValidationType === "onlyTouched" and control is not touched', () => {
      test('No validation callback is provided', async () => {
        const value = 3;

        const [, callbacks] = createTestControl<number | undefined>({
          data: createBasic({}),
          value,
          validationType: FormValidationType.onlyTouched,
          isTouched: false,
        });

        expect(await callbacks.getValidValue()).toEqual([true, value]);
      });

      test('Value is valid', async () => {
        const value = 3;

        const [, callbacks] = createTestControl<number | undefined>({
          data: createBasic({
            validate: () => null,
          }),
          value,
          validationType: FormValidationType.onlyTouched,
          isTouched: false,
        });

        expect(await callbacks.getValidValue()).toEqual([true, value]);
      });

      test('Value is invalid', async () => {
        const value = 3;

        const [, callbacks] = createTestControl<number | undefined>({
          data: createBasic({
            validate: () => ({ message: 'bazinga' }),
          }),
          value,
          validationType: FormValidationType.onlyTouched,
          isTouched: false,
        });

        expect(await callbacks.getValidValue()).toEqual([false, null]);
      });
    });
  });

  describe('If control was previously validated must not call new validation', () => {
    test('Value is valid', async () => {
      const value = 3;
      const validate = jest.fn().mockReturnValue(null);

      const [, callbacks] = createTestControl<number | undefined>({
        data: createBasic({ validate }),
        value,
        validationType: FormValidationType.always,
      });

      expect(validate).toHaveBeenCalledTimes(1);
      expect(await callbacks.getValidValue()).toEqual([true, value]);
      expect(validate).toHaveBeenCalledTimes(1);
    });

    test('Value is invalid', async () => {
      const value = 3;
      const validate = jest.fn().mockReturnValue({ message: 'bazinga' });

      const [, callbacks] = createTestControl<number | undefined>({
        data: createBasic({ validate }),
        value,
        validationType: FormValidationType.always,
      });

      expect(validate).toHaveBeenCalledTimes(1);
      expect(await callbacks.getValidValue()).toEqual([false, null]);
      expect(validate).toHaveBeenCalledTimes(1);
    });
  });
});
