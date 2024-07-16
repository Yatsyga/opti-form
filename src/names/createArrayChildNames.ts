import { TControlNames } from './TControlNames';

export function createArrayChildNames(
  parentNames: TControlNames,
  index: number
): TControlNames {
  return {
    static: `${parentNames.static}[index]`,
    dynamic: `${parentNames.dynamic}[${index}]`,
  };
}
