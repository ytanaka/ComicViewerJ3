import { toast } from "sonner";

export class DelayedToast {
  toastId?: string | number = undefined;
  canceled: boolean = false;

  constructor(delayMs: number, fn: () => string | number) {
    setTimeout(() => {
      if (!this.canceled) {
        this.toastId = fn();
      }
    }, delayMs);
  }
  dismiss() {
    this.canceled = true;
    toast.dismiss(this.toastId)
  }
}
