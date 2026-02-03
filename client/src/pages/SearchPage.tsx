import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { mobileBrands } from "@/constants/const";
import { createBrandTrie } from "@/lib/trie";
import { apiFetch } from "@/lib/api";
import type { SearchResult } from "@/components/common/AutocompleteDropdown";

interface NavigationLink {
  label: string;
  path: string;
  category: string;
}

// Move navigation links outside component to prevent recreation
const navigationLinks: NavigationLink[] = [
  { label: "Dashboard", path: "/dashboard", category: "Main" },
  { label: "Models", path: "/models", category: "Main" },
  { label: "All Pickups", path: "/pickups/all", category: "Pickups" },
  { label: "Accessories", path: "/purchase/accessories", category: "Purchase" },
  { label: "Partners Purchases", path: "/purchase/partners-purchases", category: "Purchase" },
  { label: "New Mobile Purchases", path: "/purchase/new-mobile-purchases", category: "Purchase" },
  { label: "Sales Invoices", path: "/sales/sales-invoices", category: "Sales" },
  { label: "Sales Returns", path: "/sales/sales-returns", category: "Sales" },
  { label: "Parties", path: "/clients/parties", category: "Clients" },
  { label: "Customers", path: "/clients/customers", category: "Clients" },
  { label: "Employees", path: "/manage-team/employees", category: "Manage Team" },
  { label: "Pre-Owned Mobiles", path: "/items/pre-owned-mobiles", category: "Items" },
  { label: "Brand New Mobiles", path: "/items/brand-new-mobiles", category: "Items" },
  { label: "Laptops", path: "/items/laptops", category: "Items" },
  { label: "Accessories", path: "/items/accessories", category: "Items" },
  { label: "Daily Reports", path: "/reports/daily-reports", category: "Reports" },
  { label: "Monthly Reports", path: "/reports/monthly-reports", category: "Reports" },
  { label: "QC Reports", path: "/reports/qc-reports", category: "Reports" },
  { label: "Stock Reports", path: "/reports/stock-reports", category: "Reports" },
  { label: "Wallet Balances", path: "/wallet/wallet-balances", category: "Wallet" },
  { label: "Settings", path: "/settings", category: "Other" },
  { label: "Sessions", path: "/sessions", category: "Other" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [linkResults, setLinkResults] = useState<NavigationLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Memoize brandTrie to prevent recreation on every render
  const brandTrie = useMemo(() => createBrandTrie(mobileBrands), []);

  // Initialize search term from URL query parameter
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  // Only trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch === "") {
      setSearchResults([]);
      setLinkResults(navigationLinks);
      setLoading(false);
      return;
    }
    
    // Define search function inline to avoid dependency issues
    const executeSearch = async () => {
      setLoading(true);
      const results: SearchResult[] = [];
      
      try {
        // Search brands using Trie (O(m) where m is search term length)
        const brandMatches = brandTrie.search(debouncedSearch);
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

        // Search models and model codes via API (with debouncing already applied)
        const response = await apiFetch(`/models/search?q=${encodeURIComponent(debouncedSearch)}`);
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
        
        // Filter navigation links (O(n) where n is number of links - constant time)
        const filteredLinks = navigationLinks.filter(link =>
          link.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          link.category.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
        setLinkResults(filteredLinks);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setLinkResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    executeSearch();
  }, [debouncedSearch, brandTrie]);

  // Initialize with all navigation links on mount
  useEffect(() => {
    setLinkResults(navigationLinks);
  }, []);

  // Global keyboard shortcuts (Ctrl/Cmd+K, /)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
      }
      // / to focus search (if not already focused on an input)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'brand') {
      navigate(`/model/${result.id}`);
    } else if (result.type === 'model' || result.type === 'modelCode') {
      navigate(`/model/${result.data.brand}/${result.data.smc}`);
    }
  };

  const handleLinkSelect = (path: string) => {
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = searchResults.length + linkResults.length;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
        // Scroll active item into view
        setTimeout(() => {
          const activeElement = document.querySelector('.bg-purple-50');
          activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
        // Scroll active item into view
        setTimeout(() => {
          const activeElement = document.querySelector('.bg-purple-50');
          activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
        break;
      case "Enter":
        e.preventDefault();
        if (totalResults === 0) return;
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
        e.preventDefault();
        if (searchTerm) {
          setSearchTerm("");
          setActiveIndex(0);
        } else {
          navigate(-1);
        }
        break;
    }
  };

  // Group links by category
  const groupedLinks = linkResults.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, NavigationLink[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-screen">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 pt-8 px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Search</h1>
            <p className="text-gray-600">Search for brands, models, codes, or navigate to pages</p>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <Input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to search..."
              className="h-16 pl-14 pr-4 text-lg shadow-lg border-2 border-gray-200 focus:border-purple-500 rounded-2xl"
            />
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-6 text-sm text-gray-500 flex items-center gap-6 flex-wrap">
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">↑↓</kbd>
              <span className="text-gray-600">Navigate</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">↵</kbd>
              <span className="text-gray-600">Select</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">ESC</kbd>
              <span className="text-gray-600">Clear / Go Back</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+K</kbd>
              <span className="text-gray-600">Focus</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">/</kbd>
              <span className="text-gray-600">Quick Focus</span>
            </span>
          </div>
        </div>

        {/* Scrollable Results Section */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-[16px] shadow-xl overflow-hidden py-2">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                <span className="text-xl">Searching...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Search Results (Brands, Models, Codes) */}
              {searchResults.length > 0 && (
                <div className="border-b border-gray-200 ">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
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
                        <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center p-2">
                          <img
                            src={result.image}
                            alt={result.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900">{result.name}</div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 mt-0.5">{result.subtitle}</div>
                        )}
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Links */}
              {Object.entries(groupedLinks).map(([category, links]) => (
                <div key={category} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  {links.map((link) => {
                    const globalIndex = searchResults.length + linkResults.indexOf(link);
                    return (
                      <div
                        key={link.path}
                        className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-all ${
                          activeIndex === globalIndex
                            ? "bg-purple-50 border-l-4 border-purple-500"
                            : "hover:bg-gray-50 border-l-4 border-transparent"
                        }`}
                        onClick={() => handleLinkSelect(link.path)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                      >
                        <span className="font-medium text-gray-700">{link.label}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              ))}

              {searchResults.length === 0 && linkResults.length === 0 && searchTerm && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-xl font-medium">No results found</p>
                  <p className="text-sm text-gray-400 mt-2">Try different keywords</p>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
