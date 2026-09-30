"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

export type ClientOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
};

function clientLabel(client: ClientOption): string {
  const primary = client.name || client.company || client.email || "";
  const secondary = client.company && client.name ? ` (${client.company})` : "";
  return `${primary}${secondary}`;
}

export type ClientComboboxProps = {
  clients: ClientOption[];
  value?: string;
  onChange: (clientId: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
};

export function ClientCombobox({
  clients,
  value,
  onChange,
  placeholder = "Select a client",
  invalid,
  disabled,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-xl font-normal shadow-sm",
            invalid && "border-destructive",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selected ? clientLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search clients by name, company or email..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${clientLabel(client)} ${client.email ?? ""}`}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === client.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate">
                      {client.name || client.company || client.email}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[client.company && client.name ? client.company : null, client.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
