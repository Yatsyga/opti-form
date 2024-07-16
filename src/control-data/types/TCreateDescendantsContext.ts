import { TControlValue } from '../../TControlValue';

export type TCreateDescendantsContext<Value, Context, DescendantsContext> = (
  value: TControlValue<Value>,
  context: Context
) => DescendantsContext;
