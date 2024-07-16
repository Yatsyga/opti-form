import { TControlError } from '../validation';
import { createArray } from './createArray';
import { createBasic } from './createBasic';
import { createObject } from './createObject';

const noValueError: TControlError = {
  message: 'error',
};

export const testBasic1 = createBasic<number>({ noValueError });
export const testBasic2 = createBasic<number | undefined>({});

interface ITest {
  baz: string;
  inga?: 1 | 3;
  bazinga: {
    x?: number;
    y: boolean;
    nest?: { bird?: string; else: boolean };
  };
  zingarr: {
    x: number;
  }[];
}

export const testObject = createObject<ITest, number>({
  fieldsData: {
    baz: createBasic({ noValueError }),
    inga: createBasic({ validate: (val) => null }),
    bazinga: createObject<ITest['bazinga'], number, boolean>(
      {
        fieldsData: {
          x: createBasic({ validate: (val, context) => null, usesContext: true }),
          y: createBasic({ validate: (val) => null, noValueError: { message: 'baz' } }),
          nest: createObject({
            fieldsData: {
              bird: createBasic({ validate: (val, context) => null, usesContext: true }),
              else: createBasic({ noValueError: { message: '2' } }),
            },
          }),
        },
        noValueError: {
          message: 'noo',
        },
      },
      { createDescendantsContext: (_val, context) => context > 0 }
    ),
    zingarr: createArray<ITest['zingarr'], number, string>(
      {
        childData: createObject({
          fieldsData: {
            x: createBasic({
              validate: (val, context) => null,
              usesContext: true,
              noValueError,
            }),
          },
          noValueError,
        }),
        noValueError,
      },
      { createDescendantsContext: (_val, context) => context.toString(), usesContext: true }
    ),
  },
  noValueError: {
    message: 'error',
  },
});
