import { toast } from "sonner";

let prevError = "";

export function logErr(errorResult: { status: 'error'; error: string }) {
  if (errorResult.error === prevError) {
    return;
  }
  toast.error(errorResult.error);
  prevError = errorResult.error;
}
