/**
 * Typed iteration over object keys.
 * @param obj
 * @param callback if callback returns true, cycle breaks
 */
export function iterateObjectKeys<T extends Record<string, any>>(
  obj: T,
  callback: <Key extends keyof T>(key: Key, value: T[Key]) => boolean | undefined
): void {
  for (const keyStr in obj) {
    const key = keyStr as keyof T;
    if (callback(key, obj[key])) {
      break;
    }
  }
}
