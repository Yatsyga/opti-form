import { TIsBasicControlValue } from '../../types';
import { TControlArrayValue, TControlObjectValue } from '../../values';

export type TControlDescendantsPath<Value> = Exclude<TInternalPath<Value, ''>, ''>;

export type TControlDescendantsPathDynamic<Value> = Exclude<TInternalPath<Value, '', number>, ''>;

type TIndexType = 'index' | number;

type TInternalPath<Value, PrevPath extends string, IndexType extends TIndexType = 'index'> =
  | PrevPath
  | (NonNullable<Value> extends TControlArrayValue
      ? TArrayPath<NonNullable<Value>, PrevPath, IndexType>
      : TIsBasicControlValue<NonNullable<Value>> extends true
        ? PrevPath
        : Value extends TControlObjectValue
          ? TObjectPaths<Value, PrevPath, IndexType>
          : PrevPath);

type TObjectPaths<T extends TControlObjectValue, PrevPath extends string, IndexType extends TIndexType> = {
  [Key in keyof T]-?: TInternalPath<T[Key], PrevPath extends '' ? Key & string : `${PrevPath}.${Key & string}`, IndexType>;
}[keyof T];

type TArrayPath<
  T extends TControlArrayValue,
  PrevPath extends string,
  IndexType extends TIndexType,
> = TInternalPath<T[number], `${PrevPath}[${IndexType}]`, IndexType>;
