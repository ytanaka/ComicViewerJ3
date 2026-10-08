import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

export function LinkButton({ label, title, onClick }: { label: string, title?: string, onClick: () => Promise<void> }) {
  return (
    <Button title={title} size="sm" className="font-light" variant="link" onClick={onClick}>
      {label}<ExternalLink />
    </Button>
  );
}
