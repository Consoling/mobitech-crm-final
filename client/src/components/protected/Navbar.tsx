import { useState, useEffect } from "react";
import {
  Search,
  MessageSquare,
  Bell,
  Menu,

  ChevronDown,
  ChevronRight,

  CircleUserRound,
  ChevronLeft,
  Truck,
} from "lucide-react";
import {
  Popover,
  PopoverContent,

  PopoverHeader,

  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Smartphone,
  Box,
  ShoppingCart,
  TrendingUp,
  Package,
  CircleUser,
  FileText,
  Wallet,
  Users,
  Settings,
  Clock,
  Search as SearchIcon,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { logout } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  subItems?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },

  { label: "Models", icon: Smartphone, path: "/models" },
  {
    label: "Logistics",
    icon: Truck,
    path: "/logistics",
  },
  {
    label: "Pickups",
    icon: Box,
    subItems: [{ label: "All Pickups", path: "/pickups/all" }],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    subItems: [
      { label: "Accessories", path: "/purchase/accessories" },
      { label: "Partners Purchases", path: "/purchase/partners-purchases" },
      { label: "New Mobile Purchases", path: "/purchase/new-mobile-purchases" },
    ],
  },
  {
    label: "Sales",
    icon: TrendingUp,
    subItems: [
      { label: "Sales Invoices", path: "/sales/sales-invoices" },
      { label: "Sales Returns", path: "/sales/sales-returns" },
    ],
  },
  {
    label: "Clients",
    icon: CircleUser,
    subItems: [
      { label: "Parties", path: "/clients/parties" },
      { label: "Customers", path: "/clients/customers" },
    ],
  },
  {
    label: "Manage Team",
    icon: Users,
    subItems: [{ label: "Employees", path: "/manage-team/employees" }],
  },
  {
    label: "Items",
    icon: Package,
    subItems: [
      { label: "Pre-Owned Mobiles", path: "/items/pre-owned-mobiles" },
      { label: "Brand New Mobiles", path: "/items/brand-new-mobiles" },
      { label: "Laptops", path: "/items/laptops" },
      { label: "Accessories", path: "/items/accessories" },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    subItems: [
      { label: "Daily Reports", path: "/reports/daily-reports" },
      { label: "Monthly Reports", path: "/reports/monthly-reports" },
      { label: "QC Reports", path: "/reports/qc-reports" },
      { label: "Stock Reports", path: "/reports/stock-reports" },
    ],
  },
  {
    label: "Wallet",
    icon: Wallet,
    subItems: [{ label: "Wallet Balances", path: "/wallet/wallet-balances" }],
  },
];

const menu2Items: MenuItem[] = [
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Sessions", icon: Clock, path: "/sessions" },
  { label: "Search", icon: SearchIcon, path: "/search" },
];

const Navbar = () => {
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMac, setIsMac] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { user } = useAuthStore();



  // Detect Mac OS
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        navigate("/search");
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [navigate]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setShowSearchDropdown(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setSearchTerm("");
      setShowSearchDropdown(false);
    }
  };

 
  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (subItems?: { path: string }[]) => {
    if (!subItems) return false;
    return subItems.some((item) => location.pathname === item.path);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between h-15 border-b border-gray-200 pl-4 pr-2">
          <img
            src="/sidebar-logo.png"
            alt="Mobitech Logo"
            className="h-11 object-contain"
          />
          <button
            onClick={closeMobileSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-[#525e73] bg-gray-200/70 rounded-full" />
          </button>
        </div>

        {/* Mobile Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-4 h-[calc(100vh-140px)]">
        

          {/* Menu Items */}
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isParentActive(item.subItems)
                          ? "bg-blue-50 text-[#296CFF]"
                          : "text-[#0F172B] hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          expandedMenus.includes(item.label) ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedMenus.includes(item.label) && (
                      <div className="ml-8 mt-1 space-y-1 relative">
                        <div className="absolute left-0 top-2 bottom-2 w-px bg-gray-300"></div>
                        {item.subItems.map((subItem) => (
                          <div key={subItem.path} className="relative">
                            <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-300"></div>
                            <Link
                              to={subItem.path}
                              onClick={closeMobileSidebar}
                              className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ml-3 ${
                                isActive(subItem.path)
                                  ? "bg-[#296CFF] text-white font-medium"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path!}
                    onClick={closeMobileSidebar}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-[#296CFF] text-white font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* OTHER Section */}
          <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Other
            </h3>
          </div>

          {/* Menu2 Items */}
          <nav className="space-y-1 px-2">
            {menu2Items.map((item) => (
              <Link
                key={item.label}
                to={item.path!}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-[#296CFF] text-white font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Sidebar Bottom */}
        <div className="border-t border-gray-200 p-4 ">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200">
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
          <div className="text-center text-[12px] text-[#90A1B9] mt-3">
            <p>Version 1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Navbar */}
      <nav className="h-15 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shadow-sm">
        {/* Mobile: Hamburger + Page Name */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-gray-700" />
          </button>
          {/* <h1 className="text-base font-semibold text-gray-900">
            {getPageName()}
          </h1> */}
        </div>

        {/* Desktop: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md ml-12">
          <div className="relative w-full cursor-pointer search-container">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              size={20}
            />
            <input
              type="text"
              placeholder="Search or type command..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchDropdown(e.target.value.length > 0);
              }}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchTerm && setShowSearchDropdown(true)}
              className="w-full pl-10 text-base pr-20 py-2 bg-[#FFFFFF] border border-[#E4E7EC] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#296CFF]/20 focus:border-[#296CFF] transition-all text-gray-600 text-[14px] placeholder:text-gray-500"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white border border-[#E4E7EC] rounded text-xs font-mono text-gray-500 pointer-events-none shadow-sm">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>

            {/* Search Dropdown */}
            {showSearchDropdown && debouncedSearchTerm && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E4E7EC] rounded-lg shadow-lg overflow-hidden z-50">
                <div
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={handleSearchSubmit}
                >
                  <div className="flex items-center gap-3">
                    <Search
                      className="text-gray-400 group-hover:text-[#296CFF] transition-colors"
                      size={18}
                    />
                    <span className="text-gray-700 text-sm">
                      Search for{" "}
                      <span className="font-semibold text-gray-900">
                        "{debouncedSearchTerm}"
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-500">
                      Enter
                    </kbd>
                    <ChevronRight
                      className="text-gray-400 group-hover:text-[#296CFF] transition-colors"
                      size={18}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Time and Date */}
          {/* Mobile: Simple Date Format */}
          {/* <div className="flex md:hidden flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-500">
              {formatSimpleDate(currentTime)}
            </span>
          </div> */}

          {/* Notification Icons */}
          <div className="flex items-center gap-2">
            {/* Desktop: Message Icon */}
            <button className="hidden md:block relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MessageSquare size={22} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Bell Icon - Visible on all screens */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={22} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* User Section */}
          <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 hover:cursor-pointer hover:bg-gray-200 p-2 hover:rounded-md">
                <div className="w-8 h-8 rounded-full bg-linear-to-r from-[#296CFF] to-[#155DFC] flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user?.email?.split("@")[0].charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="hidden lg:flex overflow-hidden gap-1">
                  <span className="font-medium text-sm text-[#344054] truncate">
                    {user?.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 mt-0.5 hover:cursor-pointer hover:bg-gray-200 transition-all ease-in-out rounded-full ${isProfileOpen ? "-rotate-180" : ""}`}
                  />
                  {/* <span className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </span> */}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="rounded-[16px] mt-1.5 w-62.5">
              <PopoverHeader>
                <span className="font-medium text-xs text-[#344054] truncate">
                  {user?.email}
                </span>
                <div className="flex flex-col gap-1.5 mt-2">
                  <Button
                    className="rounded-[10px] text-xs text-[#344054]"
                    variant={"outline"}
                  >
                    <span>View Profile</span> <CircleUserRound />
                  </Button>
                  <Button
                    className="rounded-[10px] text-xs"
                    variant={"destructive"}
                    onClick={() => setLogoutOpen(true)}
                  >
                    <span>Log Out</span> <LogOut />
                  </Button>
                </div>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>
      </nav>
      <ConfirmDialog
        open={logoutOpen}
        title="Logout"
        description="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
        }}
      />
    </>
  );
};

export default Navbar;
