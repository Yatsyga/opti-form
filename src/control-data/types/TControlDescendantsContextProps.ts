import { TControlObjectValue } from '../../values';
import { TCreateDescendantsContext } from './TCreateDescendantsContext';

export type TControlDescendantsContextProps<
  Value extends TControlObjectValue,
  Context,
  DescendantsContext,
> =
  | {
      createDescendantsContext: TCreateDescendantsContext<Value, Context, DescendantsContext>;
      usesContext: true;
    }
  | {
      createDescendantsContext: TCreateDescendantsContext<Value, never, DescendantsContext>;
      usesContext?: false;
    };
