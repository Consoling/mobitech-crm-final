import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDeviceVariants } from "@/hooks/useDeviceVariants";

export const SelectVariantSection = ({
  newVariantName,
  setNewVariantName,
  newVariantPrice,
  setNewVariantPrice,
  handleAddVariant,
}: {
  newVariantName: string;
  setNewVariantName: (value: string) => void;
  newVariantPrice: string;
  setNewVariantPrice: (value: string) => void;
  handleAddVariant: () => void;
}) => {
  const { data: variants = [], isLoading, isError } = useDeviceVariants();
  const [open, setOpen] = useState(false);

  if (isError) {
    return <div className="text-red-500 text-sm">Failed to load variants.</div>;
  }

  return (
    <div className="mt-4">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <span className="text-[#314158] text-sm">Add New Variants</span>
          <div className="flex gap-2 mt-1.5">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="flex-1 justify-between font-normal"
                >
                  {newVariantName === "custom"
                    ? "Custom variant..."
                    : newVariantName || "Select variant"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full rounded-[16px]">
                <Command>
                  <CommandInput placeholder="Search variant..." />
                  <CommandList className="max-h-[240px] overflow-y-auto w-full">
                    {/* ~40px per item x 6 = 240px, tweak as needed */}
                    <CommandEmpty>No variant found.</CommandEmpty>
                    <CommandGroup>
                      {variants.map((variant) => (
                        <CommandItem
                          key={variant._id}
                          value={variant.variant}
                          onSelect={(currentValue: any) => {
                            setNewVariantName(currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newVariantName === variant.variant
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {variant.variant}
                        </CommandItem>
                      ))}
                    
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {newVariantName === "custom" && (
              <Input
                value=""
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Enter custom variant"
                className="flex-1"
                autoFocus
              />
            )}

            <Input
              value={newVariantPrice}
              onChange={(e) => setNewVariantPrice(e.target.value)}
              placeholder="e.g., ₹23,999 or 0"
              className="flex-1"
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddVariant())
              }
            />
            <Button type="button" onClick={handleAddVariant} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};