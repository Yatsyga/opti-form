import { ControlType } from '../ControlType';
import { TControlObjectValue } from '../values';
import { createControlValidate } from './createControlValidate';
import {
  TControlDataFields,
  TControlDataObject,
  TControlDescendantsContextProps,
  TControlValidationData,
  TCreateDescendantsContext,
} from './types';

type IBaseCreationProps<Value extends TControlObjectValue, Context, DescendantsContext> = {
  fieldsData: TControlDataFields<Value, DescendantsContext>;
} & TControlValidationData<Value, Context>;

export function createObject<
  Value extends TControlObjectValue,
  Context,
  DescendantsContext,
>(
  props: IBaseCreationProps<Value, Context, DescendantsContext>,
  descendantsData: TControlDescendantsContextProps<Value, Context, DescendantsContext>
): TControlDataObject<Value, Context>;
export function createObject<Value extends TControlObjectValue, Context>(
  props: IBaseCreationProps<Value, Context, Context>
): TControlDataObject<Value, Context>;
export function createObject<
  Value extends TControlObjectValue,
  Context,
  DescendantsContext,
>(
  props: IBaseCreationProps<Value, Context, DescendantsContext>,
  descendantsData?: TControlDescendantsContextProps<Value, Context, DescendantsContext>
): TControlDataObject<Value, Context> {
  const descendantsUsePassedContext = getDescendantsUsePassedContext<Value, DescendantsContext>(props.fieldsData);
  const { createDescendantsContext, needContextForDescendantsContext } = createDescendantsContextProps<
    Value,
    Context,
    DescendantsContext
  >(descendantsData, descendantsUsePassedContext);
  const { validate, noValueError, validationDebounceMs } = createControlValidate<Value, Context>(props);

  return {
    type: ControlType.object,
    fieldsData: props.fieldsData as TControlDataFields<Value, unknown>,
    validate,
    noValueError,
    validationDebounceMs,
    usesContext: props.usesContext ?? false,
    descendantsUsePassedContext,
    createDescendantsContext,
    needContextForDescendantsContext,
  };
}

function getDescendantsUsePassedContext<Value extends TControlObjectValue, DescendantsContext>(
  fieldsData: TControlDataFields<Value, DescendantsContext>
): boolean {
  for (const key in fieldsData) {
    if (fieldsData[key].usesContext || fieldsData[key].descendantsUsePassedContext) {
      return true;
    }
  }

  return false;
}

function createDescendantsContextProps<Value extends TControlObjectValue, Context, DescendantsContext>(
  descendantsData: TControlDescendantsContextProps<Value, Context, DescendantsContext> | undefined,
  descendantsUsePassedContext: boolean
): Pick<
  TControlDataObject<Value, Context>,
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
