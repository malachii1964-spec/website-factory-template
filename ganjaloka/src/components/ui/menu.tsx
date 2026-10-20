"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const MenuRoot = Menu.Root;
export const MenuTrigger = Menu.Trigger;

export function MenuContent({ className, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align="end"
        sideOffset={6}
        className={cn("z-50 min-w-52 rounded-xl border border-border bg-surface p-1.5 shadow-2xl", className)}
        {...props}
      />
    </Menu.Portal>
  );
}

export function MenuItem({
  className,
  tone = "default",
  ...props
}: ComponentProps<typeof Menu.Item> & { tone?: "default" | "danger" }) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-surface-2",
        tone === "danger" ? "text-danger" : "text-foreground",
        className,
      )}
      {...props}
    />
  );
}
