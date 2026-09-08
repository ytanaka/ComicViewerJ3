import { toast } from 'sonner';

export function logErr(userMsg: string, errorResult: { status: 'error'; error: string }) {
  toast.error(userMsg, {
    id: errorResult.error,
    duration: 5000,
    description: errorResult.error,
  });

}
