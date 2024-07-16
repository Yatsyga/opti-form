import { TControlValue } from '../TControlValue';
import { ITestFormValue, TestForm, TestFormStateCollector, cloneDeep, testForbiddenSurname } from './utils';

const testValue: TControlValue<ITestFormValue> = {
  title: 'zinga',
  starter: {
    id: 12,
    name: 'name12',
    surname: 'gd',
  },
  finisher: {
    id: 42,
    name: 'thinker',
    surname: 'the wise',
  },
  other: [
    { id: 1, name: 'nname', surname: 'surnname' },
    { id: 2, name: 'nnname', surname: 'surnnname' },
  ],
  additionalData: {
    date: new Date(4242424242),
    people: [
      { id: 4, name: 'namee', surname: 'surnamee' },
      { id: 5, name: 'nameee', surname: 'surnameee' },
    ],
  },
};
function recursiveFreeze(value: any) {
  if (!value || typeof value !== 'object') {
    return;
  }

  Object.freeze(value);
  for (const key in value) {
    recursiveFreeze(value[key]);
  }
}
recursiveFreeze(testValue);

describe('OptiForm', () => {
  describe('Form creation', () => {
    test('Should put correct props to all controls', () => {
      const forbiddenNames = ['alex'];
      const value: ITestFormValue = {
        title: 'bazinga',
        starter: {
          id: 0,
          name: 'name',
          surname: forbiddenNames[0],
        },
        finisher: {
          id: 42,
          name: 'thinker',
          surname: 'the wise',
        },
        other: [
          { id: 1, name: 'nname', surname: 'surnname' },
          { id: 2, name: 'nnname', surname: 'surnnname' },
          { id: 3, name: 'nnnname', surname: 'surnnnname' },
        ],
        additionalData: {
          date: new Date(4242424242),
          people: [
            { id: 4, name: 'namee', surname: 'surnamee' },
            { id: 5, name: 'nameee', surname: 'surnameee' },
            { id: 6, name: 'nameeee', surname: 'surnameeee' },
          ],
        },
      };

      const testForm = new TestForm({ value, defaultValue: testValue, context: new Set(forbiddenNames) });
      const collector = new TestFormStateCollector({
        value,
        defaultValue: testValue,
        testForm,
        extraProps: {
          'starter.surname': { error: testForbiddenSurname },
        },
      });
      expect(collector.actualState).toEqual(collector.expectedState);
      expect(testForm.form.isValid).toBe(false);
    });
  });

  test('Form must not break with various updates throw iterations', async () => {
    const testForm = new TestForm({ value: testValue, defaultValue: testValue });
    const newValue = cloneDeep(testValue);

    newValue.title = 'newValue';
    testForm.form.fields.title.setValue(newValue.title);
    await testForm.waitForUpdate();
    newValue!.additionalData!.people![1].name = 'newName';
    testForm.form.fields.additionalData.fields.people.list[1].control.fields.name.setValue(
      newValue!.additionalData!.people![1].name
    );
    await testForm.waitForUpdate();
    newValue!.additionalData!.people!.splice(0, 1);
    testForm.form.fields.additionalData.fields.people.list[0].delete();
    await testForm.waitForUpdate();
    newValue!.additionalData!.people![0].surname = 'Macleod';
    testForm.form.fields.additionalData.fields.people.list[0].control.fields.surname.setValue(
      newValue!.additionalData!.people![0].surname
    );
    newValue!.other!.splice(1, 1);
    testForm.form.fields.other.list[1].delete();
    await testForm.waitForUpdate();
    const collector = new TestFormStateCollector({
      value: newValue,
      defaultValue: testValue,
      testForm,
      extraProps: {
        title: { isTouched: true },
        'additionalData.people[0].name': { isTouched: true },
        'additionalData.people[0].surname': { isTouched: true },
        other: { isTouched: true, isDirty: true },
      },
    });
    expect(collector.actualState).toEqual(collector.expectedState);
  });

  test('Reset applies default value and clears touched states', async () => {
    const testForm = new TestForm({ value: testValue, defaultValue: testValue });

    testForm.form.fields.title.setValue('newValue');
    await testForm.waitForUpdate();
    testForm.form.fields.additionalData.fields.people.list[1].control.fields.name.setValue('new name');
    await testForm.waitForUpdate();
    testForm.form.fields.additionalData.fields.people.list[0].delete();
    await testForm.waitForUpdate();
    testForm.form.fields.additionalData.fields.people.list[0].control.fields.surname.setValue('Macleod');
    testForm.form.fields.other.list[1].delete();
    await testForm.waitForUpdate();
    testForm.form.reset();
    await testForm.waitForUpdate();
    const collector = new TestFormStateCollector({
      value: testValue,
      defaultValue: testValue,
      testForm,
    });
    expect(collector.actualState).toEqual(collector.expectedState);
  });

  test('Setting context will trigger validation', async () => {
    const forbiddenSurnames = new Set([testValue.starter!.surname!]);
    const testForm = new TestForm({ value: testValue, defaultValue: testValue });

    testForm.form.setContext(forbiddenSurnames);
    await testForm.waitForUpdate();
    const collector = new TestFormStateCollector({
      value: testValue,
      defaultValue: testValue,
      testForm,
      extraProps: {
        'starter.surname': { error: testForbiddenSurname },
      },
    });
    expect(collector.actualState).toEqual(collector.expectedState);
  });

  describe('Calling method getValidValue', () => {
    test('If no updates are pending should resolve Promise right away', async () => {
      const testForm = new TestForm({ value: testValue, defaultValue: testValue });
      let emitted: ITestFormValue | undefined | null = undefined;

      testForm.form.getValidValue().then((value) => (emitted = value));
      await Promise.resolve();
      expect(emitted).toEqual(testValue);
    });

    test('If update is pending and validation passes should return value on next instance creation', async () => {
      const testForm = new TestForm({ value: testValue, defaultValue: testValue });
      let emitted: ITestFormValue | undefined | null = undefined;
      const newTitle = 'new ' + testValue.title;
      const newValue = { ...testValue, title: newTitle };

      testForm.form.fields.title.setValue(newTitle);
      testForm.form.getValidValue().then((value) => (emitted = value));
      await testForm.waitForUpdate();
      expect(emitted).toEqual(newValue);
    });

    test('If update is pending and validation fails should return null on next instance creation', async () => {
      let emitted: ITestFormValue | undefined | null = undefined;
      const newStarterSurname = 'new ' + testValue.starter!.surname;
      const forbiddenNames = new Set([newStarterSurname]);
      const newValue = { ...testValue, starter: { ...testValue.starter!, surname: newStarterSurname } };
      const testForm = new TestForm({ value: testValue, defaultValue: testValue, context: forbiddenNames });

      testForm.form.fields.starter.fields.surname.setValue(newStarterSurname);
      testForm.form.getValidValue().then((value) => (emitted = value));
      await testForm.waitForUpdate();
      expect(emitted).toBe(null);
    });

    describe('Applying custom errors', () => {
      describe('From flat list', () => {
        test('With present errors must apply them to fields', async () => {
          const testForm = new TestForm({ value: testValue, defaultValue: testValue });
          testForm.form.applyFlatErrorsList([
            { error: { message: 'title bazinga' }, path: 'title' },
            { error: { message: 'starter surname bazinga' }, path: 'starter.surname' },
            { error: { message: 'other bazinga' }, path: 'other' },
            { error: { message: 'other child bazinga' }, path: 'other.1' },
            { error: { message: 'other child name bazinga' }, path: 'other.1.name' },
            { error: { message: 'other child surname bazinga' }, path: 'other[1].surname' },
          ]);
          await testForm.waitForUpdate();

          expect(testForm.form.fields.title.error).toEqual({ message: 'title bazinga' });
          expect(testForm.form.fields.starter.fields.surname.error).toEqual({ message: 'starter surname bazinga' });
          expect(testForm.form.fields.other.error).toEqual({ message: 'other bazinga' });
          expect(testForm.form.fields.other.list[0].control.isValid).toBe(true);
          expect(testForm.form.fields.other.list[1].control.error).toEqual({ message: 'other child bazinga' });
          expect(testForm.form.fields.other.list[1].control.fields.name.error).toEqual({
            message: 'other child name bazinga',
          });
          expect(testForm.form.fields.other.list[1].control.fields.surname.error).toEqual({
            message: 'other child surname bazinga',
          });
        });
      });

      test('If control is modified after custom errors apply, should remove error', async () => {
        const testForm = new TestForm({ value: testValue, defaultValue: testValue });
        testForm.form.applyFlatErrorsList([
          { error: { message: 'title bazinga' }, path: 'title' },
          { error: { message: 'starter surname bazinga' }, path: 'starter.surname' },
          { error: { message: 'other bazinga' }, path: 'other' },
          { error: { message: 'other child bazinga' }, path: 'other.1' },
          { error: { message: 'other child name bazinga' }, path: 'other.1.name' },
          { error: { message: 'other child surname bazinga' }, path: 'other[1].surname' },
        ]);
        await testForm.waitForUpdate();

        testForm.form.fields.title.setValue('some very very new value');
        await testForm.waitForUpdate();
        expect(testForm.form.fields.title.error).toBe(null);
      });
    });

    // There is a weird issues with timer here, need to investigate
    // test('If update is pending and validation fails should return null on next instance creation', async () => {
    //   jest.useFakeTimers();

    //   let emitted: ITestFormValue | undefined | null = undefined;
    //   const forbiddenNames = ['name1', 'name2', 'name3', 'name4', 'name5', 'name6'];
    //   const asyncValidationDuration = 1000;
    //   const testForm = new TestForm({ value: testValue, defaultValue: testValue, context: new Set(forbiddenNames), asyncValidationDuration: 1000 });

    //   console.log('test start');
    //   testForm.form.fields.other.list[0].control.fields.surname.setValue(forbiddenNames[0]);
    //   testForm.form.getValidValue().then((value) => emitted = value);
    //   jest.advanceTimersByTime(0);
    //   await testForm.waitForUpdate();
    //   jest.advanceTimersByTime(asyncValidationDuration - 1);
    //   expect(emitted).toBe(undefined);
    //   jest.advanceTimersByTime(1);
    //   expect(emitted).toBe(undefined);
    //   console.log('test end');
    //   // expect(emitted).toBe(null);

    //   jest.useRealTimers();
    // });
  });
});
