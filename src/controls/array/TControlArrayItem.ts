import { TControl } from '../TControl';

export class TControlArrayItem<Value> {
  constructor(
    public readonly id: string,
    public control: TControl<Value>,
    private readonly onDelete: (id: string) => void
  ) {}

  public readonly delete = (): void => {
    this.onDelete(this.id);
  };
}
