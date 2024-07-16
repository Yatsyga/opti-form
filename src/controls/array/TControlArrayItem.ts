import { TControl } from '../TControl';

export class TControlArrayItem<Value> {
  constructor(
    /**
     * Unique control id to provide as key prop to tsx element
     */
    public readonly id: string,
    /**
     * Child control
     */
    public control: TControl<Value>,
    private readonly onDelete: (id: string) => void
  ) {}

  /**
   * Deletes this control from parent
   */
  public readonly delete = (): void => {
    this.onDelete(this.id);
  };
}
