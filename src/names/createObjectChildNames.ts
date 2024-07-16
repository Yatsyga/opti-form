import { TControlNames } from './TControlNames';

export function createObjectChildNames(
  parentNames: TControlNames,
  childName: string
): TControlNames {
  return {
    static: parentNames.static + '.' + childName,
    dynamic: parentNames.dynamic + '.' + childName,
  };
}
