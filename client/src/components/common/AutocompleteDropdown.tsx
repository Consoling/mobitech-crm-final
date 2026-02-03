import { cn } from "@/lib/utils";
import { Braces, Cpu, Smartphone } from "lucide-react";
import { useEffect, useRef } from "react";

export interface SearchResult {
  type: "brand" | "model" | "modelCode";
  id: string;
  name: string;
  image?: string;
  subtitle?: string;
  data?: any;
}

interface AutocompleteDropdownProps {
  results: SearchResult[];
  isOpen: boolean;
  onSelect: (result: SearchResult) => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  loading?: boolean;
}

const AutocompleteDropdown = ({
  results,
  isOpen,
  onSelect,
  activeIndex,
  onActiveIndexChange,
  loading = false,
}: AutocompleteDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active item
  useEffect(() => {
    if (activeItemRef.current && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const activeItem = activeItemRef.current;
      
      const dropdownRect = dropdown.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      if (itemRect.bottom > dropdownRect.bottom) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (itemRect.top < dropdownRect.top) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Search Results Container */}
      <div className="overflow-y-auto max-h-96 ">
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-3 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-lg">Searching...</span>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm text-gray-400 mt-2">Try different keywords</p>
        </div>
      ) : (
        <div className="py-2">
          {/* Group by type */}
          {results.some((r) => r.type === "brand") && (
            <div>
              <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 flex items-center gap-2">
                <Smartphone /> Brands
              </div>
              {results
                .filter((r) => r.type === "brand")
                .map((result) => {
                  const globalIndex = results.indexOf(result);
                  return (
                    <div
                      key={`brand-${result.id}`}
                      ref={activeIndex === globalIndex ? activeItemRef : null}
                      className={cn(
                        "px-6 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150",
                        activeIndex === globalIndex
                          ? "bg-linear-to-r from-purple-50 to-purple-100/50 border-l-4 border-purple-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      )}
                      onClick={() => onSelect(result)}
                      onMouseEnter={() => onActiveIndexChange(globalIndex)}
                    >
                      {result.image && (
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center p-2">
                          <img
                            src={result.image}
                            alt={result.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">{result.name}</div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {results.some((r) => r.type === "model") && (
            <div>
              <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-t flex items-center gap-2">
               <Cpu /> Models
              </div>
              {results
                .filter((r) => r.type === "model")
                .map((result) => {
                  const globalIndex = results.indexOf(result);
                  return (
                    <div
                      key={`model-${result.id}`}
                      ref={activeIndex === globalIndex ? activeItemRef : null}
                      className={cn(
                        "px-6 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150",
                        activeIndex === globalIndex
                          ? "bg-linear-to-r from-purple-50 to-purple-100/50 border-l-4 border-purple-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      )}
                      onClick={() => onSelect(result)}
                      onMouseEnter={() => onActiveIndexChange(globalIndex)}
                    >
                      {result.image && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
                          <img
                            src={result.image}
                            alt={result.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">{result.name}</div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Brand: {result.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {results.some((r) => r.type === "modelCode") && (
            <div>
              <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-t flex items-center gap-2">
                <Braces /> Model Codes
              </div>
              {results
                .filter((r) => r.type === "modelCode")
                .map((result) => {
                  const globalIndex = results.indexOf(result);
                  return (
                    <div
                      key={`code-${result.id}`}
                      ref={activeIndex === globalIndex ? activeItemRef : null}
                      className={cn(
                        "px-6 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150",
                        activeIndex === globalIndex
                          ? "bg-linear-to-r from-purple-50 to-purple-100/50 border-l-4 border-purple-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      )}
                      onClick={() => onSelect(result)}
                      onMouseEnter={() => onActiveIndexChange(globalIndex)}
                    >
                      {result.image && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
                          <img
                            src={result.image}
                            alt={result.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-base font-mono text-purple-600">
                          {result.name}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Model: {result.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
          </div>
    </div>
  );
};

export default AutocompleteDropdown;
