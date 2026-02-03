import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { mobileBrands } from "@/constants/const";
import { createBrandTrie } from "@/lib/trie";
import { apiFetch } from "@/lib/api";
import type { SearchResult } from "./AutocompleteDropdown";

interface NavigationLink {
  label: string;
  path: string;
  category: string;
}

interface SettingsSearchProps {
  isOpen: boolean;
  onClose: () => void;
  navigationLinks: NavigationLink[];
  onNavigate: (path: string) => void;
}

const SettingsSearch = ({ isOpen, onClose, navigationLinks, onNavigate }: SettingsSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [linkResults, setLinkResults] = useState<NavigationLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const brandTrie = createBrandTrie(mobileBrands);

  const performSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setLinkResults(navigationLinks);
      return;
    }

    setLoading(true);
    const results: SearchResult[] = [];
    
    try {
      // Search brands using Trie
      const brandMatches = brandTrie.search(term);
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

      // Search models and model codes via API
      const response = await apiFetch(`/models/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (data.success) {
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

      setSearchResults(results);
      
      // Filter navigation links
      const filteredLinks = navigationLinks.filter(link =>
        link.label.toLowerCase().includes(term.toLowerCase()) ||
        link.category.toLowerCase().includes(term.toLowerCase())
      );
      setLinkResults(filteredLinks);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [brandTrie, navigationLinks]);

  useEffect(() => {
    performSearch(debouncedSearch);
  }, [debouncedSearch, performSearch]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setLinkResults(navigationLinks);
    }
  }, [isOpen, navigationLinks]);

  const handleSelect = (result: SearchResult) => {
    setSearchTerm("");
    let path = '';
    if (result.type === 'brand') {
      path = `/model/${result.id}`;
    } else if (result.type === 'model' || result.type === 'modelCode') {
      path = `/model/view/${result.data.smc}`;
    }
    if (path) {
      onNavigate(path);
    }
  };

  const handleLinkSelect = (path: string) => {
    onNavigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = searchResults.length + linkResults.length;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex < searchResults.length) {
          handleSelect(searchResults[activeIndex]);
        } else {
          const linkIndex = activeIndex - searchResults.length;
          if (linkResults[linkIndex]) {
            handleLinkSelect(linkResults[linkIndex].path);
          }
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group links by category
  const groupedLinks = linkResults.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, NavigationLink[]>);

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
          <Input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for brands, models, codes, or navigate to pages..."
            className="h-14 pl-12 pr-4 text-white shadow-2xl border-2 border-gray-300 focus:border-purple-500 bg-gray-300/50 placeholder-white/70 text-lg rounded-xl"
          />
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-2xl max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                <span className="text-lg">Searching...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Search Results (Brands, Models, Codes) */}
              {searchResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Search Results
                    </h3>
                  </div>
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-all ${
                        activeIndex === index
                          ? "bg-purple-50 border-l-4 border-purple-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      {result.image && (
                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center p-2">
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
                          <div className="text-xs text-gray-500 mt-0.5">{result.subtitle}</div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Links */}
              {Object.entries(groupedLinks).map(([category, links]) => (
                <div key={category} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  {links.map((link) => {
                    const globalIndex = searchResults.length + linkResults.indexOf(link);
                    return (
                      <div
                        key={link.path}
                        className={`px-6 py-3.5 flex items-center justify-between cursor-pointer transition-all ${
                          activeIndex === globalIndex
                            ? "bg-purple-50 border-l-4 border-purple-500"
                            : "hover:bg-gray-50 border-l-4 border-transparent"
                        }`}
                        onClick={() => handleLinkSelect(link.path)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                      >
                        <span className="font-medium text-gray-700">{link.label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              ))}

              {searchResults.length === 0 && linkResults.length === 0 && searchTerm && (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg font-medium">No results found</p>
                  <p className="text-sm text-gray-400 mt-2">Try different keywords</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-sm flex items-center justify-between">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSearch;
