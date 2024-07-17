export enum FormValidationType {
  /**
   * always means controls will be validated on value or context change
   */
  always,
  /**
   * never means validation is disabled
   */
  never,
  /**
   * onlyTouched means only touched controls will be validated on value or context change
   */
  onlyTouched,
}
