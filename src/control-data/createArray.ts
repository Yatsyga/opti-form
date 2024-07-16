import { ControlType } from '../ControlType';
import { TControlArrayValue } from '../values';
import { createControlValidate } from './createControlValidate';
import {
  TControlData,
  TControlDataArray,
  TControlDescendantsContextProps,
  TControlValidationData,
  TCreateDescendantsContext,
} from './types';

type IBaseCreationProps<Value extends TControlArrayValue, Context, DescendantsContext> = {
  childData: TControlData<Value[number], DescendantsContext>;
} & TControlValidationData<Value, Context>;

export function createArray<
  Value extends TControlArrayValue,
  Context,
  DescendantsContext,
>(
  props: IBaseCreationProps<Value, Context, DescendantsContext>,
  descendantsData: TControlDescendantsContextProps<Value, Context, DescendantsContext>
): TControlDataArray<Value, Context>;
export function createArray<Value extends TControlArrayValue, Context>(
  props: IBaseCreationProps<Value, Context, Context>
): TControlDataArray<Value, Context>;
export function createArray<
  Value extends TControlArrayValue,
  Context,
  DescendantsContext,
>(
  props: IBaseCreationProps<Value, Context, DescendantsContext>,
  descendantsData?: TControlDescendantsContextProps<Value, Context, DescendantsContext>
): TControlDataArray<Value, Context> {
  const descendantsUsePassedContext = getDescendantsUsePassedContext(props.childData, descendantsData);
  const { createDescendantsContext, needContextForDescendantsContext } = createDescendantsContextProps(
    descendantsData,
    descendantsUsePassedContext
  );
  const { validate, noValueError, validationDebounceMs } = createControlValidate<Value, Context>(props);

  return {
    type: ControlType.array,
    createDescendantsContext,
    needContextForDescendantsContext,
    childData: props.childData as TControlData<Value[number], unknown>,
    validate,
    noValueError,
    validationDebounceMs:
      typeof validationDebounceMs === 'number' && validationDebounceMs > 0 ? validationDebounceMs : 0,
    usesContext: props.usesContext ?? false,
    descendantsUsePassedContext,
  };
}

function getDescendantsUsePassedContext<Value extends TControlArrayValue, Context, DescendantsContext>(
  childData: TControlData<Value[number], DescendantsContext>,
  descendantsData?: TControlDescendantsContextProps<Value, Context, DescendantsContext>
): boolean {
  return childData.usesContext || childData.descendantsUsePassedContext;
}

function createDescendantsContextProps<Value extends TControlArrayValue, Context, DescendantsContext>(
  descendantsData: TControlDescendantsContextProps<Value, Context, DescendantsContext> | undefined,
  descendantsUsePassedContext: boolean
): Pick<
  TControlDataArray<Value, Context>,
  'createDescendantsContext' | 'needContextForDescendantsContext'
> {
  if (descendantsData && descendantsUsePassedContext) {
    return {
      createDescendantsContext: descendantsData.createDescendantsContext as TCreateDescendantsContext<
        Value,
        Context,
        unknown
      >,
      needContextForDescendantsContext: descendantsData.usesContext ?? false,
    };
  }

  if (descendantsUsePassedContext) {
    return { createDescendantsContext: (_val, context) => context, needContextForDescendantsContext: true };
  }

  return { createDescendantsContext: () => null, needContextForDescendantsContext: false };
}
