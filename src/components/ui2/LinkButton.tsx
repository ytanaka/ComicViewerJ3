import { Button } from "../ui/button";

export function LinkButton({ label, onClick }: { label: string; onClick: () => Promise<void> }) {
  return (
    <Button size="sm" className="font-light" variant="link" onClick={onClick}>
      {label}
    </Button>
  );
}
