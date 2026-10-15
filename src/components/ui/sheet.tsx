import type { ComponentProps } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: ComponentProps<typeof Dialog.Content> & { side?: "left" | "right" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/20" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex h-full w-[min(20rem,92vw)] flex-col bg-sidebar p-4 shadow-xl",
          side === "left" ? "inset-y-0 left-0" : "inset-y-0 right-0",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">Menu</Dialog.Title>
        {children}
        <Dialog.Close className="absolute top-3 right-3 rounded-lg p-2 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
