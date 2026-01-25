import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { mobileBrands } from "@/constants/const";
import { createBrandTrie } from "@/lib/trie";
import AutocompleteDropdown, { type SearchResult } from "./AutocompleteDropdown";
import { apiFetch } from "@/lib/api";

type SearchFilterBarProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;

  wrapperClassName?: string;
  inputClassName?: string;
  filterButtonClassName?: string;

  showFilter?: boolean;
  filterLabel?: string;
  filterTitle?: string;
  filterDescription?: string;
  filterContent?: ReactNode;

  // Autocomplete props
  enableAutocomplete?: boolean;
  onAutocompleteSelect?: (result: SearchResult) => void;
};

const SearchFilterBar = ({
  value,
  onValueChange,
  placeholder = "Search…",
  wrapperClassName = "flex items-center justify-between",
  inputClassName,
  filterButtonClassName,
  showFilter = true,
  filterLabel = "Filter",
  filterTitle = "Filters",
  filterDescription = "Apply filters to segregate selections",
  filterContent,
  enableAutocomplete = false,
  onAutocompleteSelect,
}: SearchFilterBarProps) => {
  // Initialize Trie once (memoized)
  const brandTrie = useMemo(() => createBrandTrie(mobileBrands), []);
  
  const [autocompleteResults, setAutocompleteResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search term to reduce API calls
  const debouncedSearch = useDebounce(value, 300);

  /**
   * MAIN SEARCH ALGORITHM
   * Combines Trie-based brand search with API-based model/code search
   * 
   * Time Complexity:
   * - Brand search (Trie): O(m + k) where m = search term length, k = results
   * - Model search (API): O(log n) due to DB indexing
   * - Total: O(m + k + log n)
   * 
   * Space Complexity: O(k) for storing results
   */
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setAutocompleteResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const results: SearchResult[] = [];

    try {
      // 1. Search brands using Trie - O(m + k)
      const brandMatches = brandTrie.search(searchTerm);
      results.push(
        ...brandMatches.slice(0, 5).map((brand) => ({
          type: "brand" as const,
          id: brand.id,
          name: brand.name,
          image: brand.logo,
          subtitle: "Brand",
          data: brand,
        }))
      );

      // 2. Search models and model codes via API - O(log n)
      const response = await apiFetch(`/models/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (data.success) {
        // Add model matches
        results.push(
          ...data.data.models.map((model: any) => ({
            type: "model" as const,
            id: model.smc,
            name: model.model,
            image: model.imageUrl,
            subtitle: model.brand.charAt(0).toUpperCase() + model.brand.slice(1),
            data: model,
          }))
        );

        // Add model code matches
        results.push(
          ...data.data.modelCodes.map((item: any) => ({
            type: "modelCode" as const,
            id: item.smc,
            name: item.matchingCode,
            image: item.imageUrl,
            subtitle: item.model,
            data: item,
          }))
        );
      }

      setAutocompleteResults(results);
      setShowDropdown(results.length > 0);
      setActiveIndex(0);
    } catch (error) {
      console.error("Search error:", error);
      setAutocompleteResults([]);
    } finally {
      setLoading(false);
    }
  }, [brandTrie]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (enableAutocomplete) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch, enableAutocomplete, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || autocompleteResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < autocompleteResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : autocompleteResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (autocompleteResults[activeIndex]) {
          handleSelect(autocompleteResults[activeIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    onValueChange(result.name);
    setShowDropdown(false);
    onAutocompleteSelect?.(result);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={wrapperClassName} ref={wrapperRef}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          className={inputClassName ?? "h-10.5 pl-10 text-sm"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            if (enableAutocomplete && e.target.value.length >= 2) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (enableAutocomplete && value.length >= 2 && autocompleteResults.length > 0) {
              setShowDropdown(true);
            }
          }}
        />
        
        {/* Autocomplete Dropdown */}
        {enableAutocomplete && (
          <AutocompleteDropdown
            results={autocompleteResults}
            isOpen={showDropdown}
            onSelect={handleSelect}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            loading={loading}
          />
        )}
      </div>

      {showFilter ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className={filterButtonClassName ?? "ml-4 h-10.5"}
              variant="outline"
              type="button"
            >
              <Filter />
              {filterLabel}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{filterTitle}</SheetTitle>
              <SheetDescription>{filterDescription}</SheetDescription>
            </SheetHeader>
            {filterContent}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
};

export default SearchFilterBar;
