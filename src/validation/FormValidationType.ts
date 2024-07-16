/**
 * @param always controls will be validated on value or context change
 * @param onlyTouched only touched controls will be validated on value or context change
 * @param never validation is disabled
 */
export enum FormValidationType {
  always,
  never,
  onlyTouched,
}
