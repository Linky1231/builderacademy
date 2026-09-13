import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmDelete({ title, description, onConfirm, children }: { title: string; description: string; onConfirm: () => Promise<void> | void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!busy) { setOpen(nextOpen); if (!nextOpen) setError(""); } }}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              try {
                await onConfirm();
                setOpen(false);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "No se pudo eliminar. Inténtalo de nuevo.");
              } finally {
                setBusy(false);
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy && <LoaderCircle className="animate-spin" />}{busy ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
