export class UpdatesSubscriber {
  private readonly subscriptions: Array<() => void> = [];

  public addSubscription(callback: () => void): { unsubscribe: () => void } {
    this.subscriptions.push(callback);
    return {
      unsubscribe: () => {
        const index = this.subscriptions.indexOf(callback);
        if (index !== -1) {
          this.subscriptions.splice(index, 1);
        }
      },
    };
  }

  public emit(): void {
    this.subscriptions.forEach((callback) => callback());
  }

  public destroy(): void {
    this.subscriptions.splice(0);
  }
}
