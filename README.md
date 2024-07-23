Welcome to OptiForm, a React library designed to simplify form management with a focus on robustness and efficiency. At its core, OptiForm leverages immutable data structures to ensure a consistent and predictable form state, empowering developers to build reliable and scalable form-based applications.

### Key Features:
- **Type Safety:** OptiForm enhances form reliability through type safety, minimizing the risk of common coding errors and ensuring your forms behave as expected.
- **Simplified Input Renderers:** Building input components is more straightforward with OptiForm. Input renderers focus solely on displaying the UI, as all validation logic and state management are handled internally. This means each control component receives all necessary data such as value, default value, validation errors, and status flags like `isTouched`, `isDirty` and `isValidating`. Controls are also designed to handle complex data structures, including nested objects and arrays.
- **Effortless Reusability:** With OptiForm, input components are designed for reusability. They are agnostic of the form's structure and focus only on handling the type of control they receive, making them easily portable across different parts of your application.
- **Optimized Performance:** OptiForm optimizes form interactions by updating only the components that have changed. This selective re-rendering approach ensures high performance, especially in forms with a large number of inputs.

### Developer Note:
While OptiForm does not ship with built-in input components, it empowers developers by simplifying the creation of custom input renderers. With OptiForm’s structured data management, creating an input component becomes an intuitive process. Each input renderer has access to all the necessary state information it needs—such as values, defaults, and validation states—streamlined into a single control object. This design not only makes your code cleaner and more maintainable but also enhances development speed by reducing the complexity typically associated with form implementations.

### Strict and non strict modes
OptiForm is meticulously designed to leverage the full capabilities of TypeScript's strict mode, ensuring robust type safety and reducing the likelihood of runtime errors. For projects that utilize strict mode, OptiForm's standard node creation methods (createBasic, createObject, createArray) offer a high level of reliability and type checking. However, if you need to use OptiForm in environments without strict mode enabled, alternative methods (createBasicLoose, createObjectLoose, createArrayLoose) are available. These methods provide similar functionalities but with a more lenient type checking process to accommodate the non-strict mode settings. While these alternatives are not as foolproof as their strict counterparts, they offer a viable solution when strict mode cannot be enabled.

## Installation

To install OptiForm, use npm or yarn:

```bash
npm install opti-form
# or
yarn add opti-form
```

For more information, check out the [detailed guide](https://github.com/exampleuser/example-repo/wiki/Getting-Started) page in our wiki.

## API
Main hook provided with opti-form is useOptiForm.
It has two generic arguments, first is value type, second is optional validation context;

### Input props
**getFieldsData**: callback that returns description of form structure;

**context**: validation context value. Optional;

**validationType**: validation type for entire form. By default it's always, which means controls will always be validated. Other possible values are onlyTouched (only touched controls are validated), and never (controls will not be validated);

**defaultValue**: default value for form, optional;

**value**: value for form, optional;

### Output props
**value**: current form value. Instance changes only when value changes;

**fields**: object with controls, fits form structure;

**isValid**: boolean, is true if no control validation fails;

**isValidating**: boolean, is true if any control is in the process of async validation;

**isTouched**: boolean, is true if any control is touched;

**isDirty**: boolean, is true if any control is dirty (current value is not equal to default value);

**applyFlatErrorsList**: callback to apply errors to form, can be used to apply validation errors received from backend;

**getValidValue**: callback that returns promise. Promise is resolved with either valid value if all validation passes, or with null, if there is any validation error. Promise will be resolved only after all async validation finishes. If there is no active or required async validation, then promise will be resolved instantly;

**reset**: callback that resets form value. Has three arguments - defaultValue, value and keepTouched. If value is not provided it will equal defaultValue. If keepTouched === true, then isTouched prop for each control will not be changed. If provided no argument at all, will reset to current default value.

## Usage
Before you start using form you first need to provide form structure data. It's a tree structure, with leaf being basic control (boolean, number, string, Date, File). And branches are object and array controls. Key difference between array and object is that array can remove and add children.

### Basic example
For example, you have the following form:
```tsx
interface IFormValue {
    name: string;
    surname?: string;
    middleName?: string;
}
```
To create and use form with that type you would need to call useOptiForm:
```tsx
const result = useOptiForm<IFormValue>({
    getFieldsData: () => ({
        name: createBasic({ noValueError: { message: 'Value is required' } }),
        surname: createBasic({}),
        middleName: createBasic({})
    })
});
```
**createBasic** creates control data for basic value types like string, boolean, number, Date or File;
**noValueError** must be provided to required controls. By types it can not be provided to optional controls. This is the error that will be thrown if control value is not set.

Then you just need to create control renderers. Here is basic example:
```tsx
import { FC } from 'react';
import { useInputValue } from 'opti-form';

export const Input: FC<{ control: TControl<string> }> = ({ control }) => {
    const [value, setValue] = useInputValue(control);

    return <div>
        {control.error && control.error.message}
        {control.isValidating && 'Is validating'}
        <input
            value={value ?? ''}
            onChange={(event) => setValue(event.currentTarget?.value)}
        />
    </div>;
}
```
**useInputValue** is a helper hook that helps to update input value synchronously. It's required only for inputs where user types the value. It's not required for other types of inputs, like checkboxes, selects, radio buttons, date pickers etc.
To optimize form and minimize rerenders count form is updated asynchronously with minimal delay.

This basic input example will work with any string control. It does not matter what validation is used by control, if any - this all is handled inside form logic.

Also you can wrap it in memo, as control's instance will be changed only if any of it's public props changes value.
Public props are: value, defaultValue, error, isValid, isValidating, isDirty, isTouched.

And to finally render form:
```tsx
<Input control={result.fields.name} />
<Input control={result.fields.middleName} />
<Input control={result.fields.surname} />
```

### Example with validation
For same form value type.
```tsx
const result = useOptiForm<IFormValue>({
    getFieldsData: () => ({
        name: createBasic({
            noValueError: { message: 'Value is required' },
            validate: (value) => value === 'forbidden' ? { message: 'Value is forbidden' } : null
        }),
        surname: createBasic({
            validate: (value) => Promise.resolve(
                value === 'forbidden' ? { message: 'Value is forbidden' } : null
            ),
            validationDebounceMs: 500
        }),
        middleName: createBasic({})
    })
});
```
In this example form will also show error for name if it equals 'forbidden';
It will also return async error for surname for same value.
Note that in this example async validation start is debounced by 500ms. You can put validation debounce for any validation, not just async ones.

### Example with context
```tsx
const result = useOptiForm<IFormValue, string>({
    getFieldsData: () => ({
        name: createBasic({
            noValueError: { message: 'Value is required' },
            validate: (value, context) => value === context ? { message: 'Value is forbidden' } : null,
            usesContext: true,
        }),
        surname: createBasic({
            validate: (value, context) => Promise.resolve(
                value === context ? { message: 'Value is forbidden' } : null
            ),
            usesContext: true,
        }),
        middleName: createBasic({})
    }),
    context: 'forbidden'
});
```
In this example name and surname will have validation errors if they match provided context. Also for each control that uses validation you need to also provide prop usesContext === true, otherwise context type in validation callback will be inferred as never, and in runtime context will not be provided.

### Basic example with object control
```tsx
interface IPerson {
    name: string;
    surname: string;
}

interface IFormValue {
    groupName: string;
    founder: IPerson;
}
```

For these types create the form like this:
```tsx
const result = useOptiForm<IFormValue>({
    getFieldsData: () => ({
        groupName: createBasic({ noValueError: { message: 'No value' } }),
        founder: createObject({
            fieldsData: {
                name: createBasic({ noValueError: { message: 'No value' } }),
                surname: createBasic({ noValueError: { message: 'No value' } }),
            },
            noValueError: { message: 'no value' }
        })
    })
});
```
You can create person renderer like this:
```tsx
const PersonRenderer: FC<{ control: TControl<IPerson> }> = ({control}) => {
    return <div>
        {control.error && control.error.message}
        {control.isValidating && 'Is validating'}
        <Input control={control.fields.name} />
        <Input control={control.fields.surname} />
    </div>;
}
```
And then call this renderer:
```tsx
return <PersonRenderer control={result.fields.founder} />;
```

### Example with descendants context
You can provide callback for object control that will generate new context for it's children props:
```tsx
const result = useOptiForm<IFormValue>({
    getFieldsData: () => ({
        groupName: createBasic({ noValueError: { message: 'No value' } }),
        founder: createObject<IPerson, never, string>({
            fieldsData: {
                name: createBasic({ noValueError: { message: 'No value' } }),
                surname: createBasic({
                    noValueError: { message: 'No value' },
                    usesContext: true,
                    validate: (value, context) => value === context ?
                        { message: 'Surname can not equal name' } :
                            null
                }),
            },
            noValueError: { message: 'No value' }
        },
        {
            createDescendantsContext: (value) => (value?.name),
        })
    })
});
```
In this example person.surname will throw error if it's value equals person's name.
Unfortunately due to Typescript limitations if you object creates descendants context you need to provide all three generic params to createObject, otherwise context provided to child fields will be inferred as unknown.

### Example with array control
The only key difference between object and array controls is that array can create and delete child controls.
```tsx
interface IFormValue {
    groupName: string;
    employees: IPerson[];
}
```
Create form like this:
```tsx
const result = useOptiForm<IFormValue>({
    getFieldsData: () => ({
        groupName: createBasic({ noValueError: { message: 'No value' } }),
        employees: createArray({
            child: createObject({
                fieldsData: {
                    name: createBasic({ noValueError: { message: 'No value' } }),
                    surname: createBasic({ noValueError: { message: 'No value' } }),
                },
            }),
            noValueError: { message: 'no value' }
        })
    })
});
```
Then create renderer:
```tsx
const EmployeesRenderer: FC<{ control: TControl<IPerson[]> }> = ({control}) => {
    return <div>
        {control.error && control.error.message}
        {control.isValidating && 'Is validating'}
        {
            control.list.map((item) =>
                <div key={item.id}>
                    <PersonRenderer control={item.control} />
                    <button onClick={item.delete}>Delete</button>
                </div>
            )
        }
        <Input control={control.fields.name} />
        <Input control={control.fields.surname} />
    </div>;
}
```