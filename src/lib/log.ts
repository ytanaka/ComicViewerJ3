import { toast } from 'sonner';

export function logErr(errorResult: { status: 'error'; error: string }) {
  toast.error(errorResult.error, { id: errorResult.error });
}
