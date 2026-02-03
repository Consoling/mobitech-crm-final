import { useState } from "react";
import {
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  ChevronRight,
  Smartphone,
  Box,
  ShoppingCart,
  TrendingUp,
  Package,
  CircleUser,
  FileText,
  Wallet,
  Clock,
  Search,
  Logs,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { logout } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuthStore } from "@/stores/authStore";

interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  subItems?: { label: string; path: string }[];
  isSpotlightSearch?: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
  },
  {
    label: "Models",
    icon: Smartphone,
    path: "/models",
  },
  {
    label: "Pickups",
    icon: Box,
    subItems: [
      { label: "All Pickups", path: "/pickups/all" },
      //   { label: "New Pickups", path: "/pickups/new" },
      //   { label: "Qualified", path: "/pickups/qualified" },
    ],
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
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
  {
    label: "Sessions",
    icon: Clock,
    path: "/sessions",
  },
  {
    label: "Search",
    icon: Search,
    path: "/search",
  },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (subItems?: { path: string }[]) => {
    if (!subItems) return false;
    return subItems.some((item) => location.pathname === item.path);
  };

  const { user } = useAuthStore();
  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out h-screen ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
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
      {/* Fixed Header - Logo Only */}
      <div className="flex items-center shadow-lg h-15 border-b border-gray-200 px-4 relative">
        <div
          className={`flex items-center transition-all duration-300 ${
            isExpanded ? "justify-start flex-1" : "justify-center w-full"
          }`}
        >
          <img
            src="/sidebar-logo.png"
            alt="Mobitech Logo"
            className={`object-contain transition-all duration-300 ${
              isExpanded ? "h-11" : "h-8 w-8"
            }`}
          />
        </div>
        {isExpanded && (
          <button
            onClick={toggleSidebar}
            className="cursor-pointer absolute -right-14  border border-[#E4E7EC] shadow-gray-600/40 p-2.5 rounded-[8px] hover:bg-gray-100 transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <Logs size={16} className="text-gray-600" />
          </button>
        )}
        {!isExpanded && (
          <button
            onClick={toggleSidebar}
            className="cursor-pointer  absolute  -right-14 top-7.5 -translate-y-1/2 border border-[#E4E7EC]  bg-white  p-2.5 rounded-[8px] shadow-md hover:shadow-lg transition-all z-10"
            title="Expand sidebar"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* User Section */}
        <div className="px-4 pb-4 mb-4 ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-r from-[#296CFF] to-[#155DFC] flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm">{user?.email?.split("@")[0].charAt(0).toUpperCase()}</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm text-gray-900 truncate">
                  {user?.email?.split("@")[0]}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {user?.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isParentActive(item.subItems)
                        ? "bg-blue-50 text-[#296CFF]"
                        : "text-[#0F172B] hover:bg-gray-100"
                    } ${isExpanded ? "justify-between" : "justify-center"}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      {isExpanded && (
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {isExpanded && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          expandedMenus.includes(item.label) ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  {isExpanded && expandedMenus.includes(item.label) && (
                    <div className="ml-8 mt-1 space-y-1 relative">
                      {/* Vertical line */}
                      <div className="absolute left-0 top-2 bottom-2 w-px bg-gray-300"></div>
                      {item.subItems.map((subItem) => (
                        <div key={subItem.path} className="relative">
                          {/* Horizontal line */}
                          <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-300"></div>
                          <Link
                            to={subItem.path}
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-[#296CFF] text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${!isExpanded && "justify-center"}`}
                >
                  <item.icon size={20} />
                  {isExpanded && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* OTHER Section */}
        {isExpanded && (
          <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Other
            </h3>
          </div>
        )}

        {/* Menu2 Items */}
        <nav className={`space-y-1 px-2 ${!isExpanded && "mt-6"}`}>
          {menu2Items.map((item) => (
            <div key={item.label}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isParentActive(item.subItems)
                        ? "bg-blue-50 text-[#296CFF]"
                        : "text-[#0F172B] hover:bg-gray-100"
                    } ${isExpanded ? "justify-between" : "justify-center"}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      {isExpanded && (
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {isExpanded && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          expandedMenus.includes(item.label) ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  {isExpanded && expandedMenus.includes(item.label) && (
                    <div className="ml-8 mt-1 space-y-1 relative">
                      {/* Vertical line */}
                      <div className="absolute left-0 top-2 bottom-2 w-px bg-gray-300"></div>
                      {item.subItems.map((subItem) => (
                        <div key={subItem.path} className="relative">
                          {/* Horizontal line */}
                          <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-300"></div>
                          <Link
                            to={subItem.path}
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-[#296CFF] text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${!isExpanded && "justify-center"}`}
                >
                  <item.icon size={20} />
                  {isExpanded && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Fixed Bottom Section */}
      <div className="border-y border-gray-200 p-2 space-y-3">
        <button
          onClick={() => setLogoutOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 transition-all duration-200 ${
            !isExpanded && "justify-center"
          }`}
        >
          <LogOut size={20} />
          {isExpanded && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
      {isExpanded && (
        <div className="text-center text-[12px] text-[#90A1B9] py-2 bg-[#F8FAFC]">
          <p>Version 1.0.0</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
