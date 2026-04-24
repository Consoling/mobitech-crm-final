import { apiJson } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

type EmployeeSuggestion = {
  type: "employee";
  employeeId: string;
  name: string;
  role: string;
  email: string | null;
  phone: string;
};

type StoreSuggestion = {
  type: "store";
  storeId: string;
  storeName: string;
  ownerName: string;
  ownerPhone: string;
};

type TeamSearchResponse = {
  items: Array<EmployeeSuggestion | StoreSuggestion>;
};

type TeamEntitySearchProps = {
  value: string;
  onValueChange: (value: string) => void;
  activeTab?: "employees" | "stores";
  wrapperClassName?: string;
};

const TeamEntitySearch = ({
  value,
  onValueChange,
  activeTab = "employees",
  wrapperClassName = "mt-5 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start max-[550px]:gap-4",
}: TeamEntitySearchProps) => {
  const navigate = useNavigate();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [items, setItems] = React.useState<
    Array<EmployeeSuggestion | StoreSuggestion>
  >([]);

  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  React.useEffect(() => {
    let isActive = true;
    const query = value.trim();

    if (query.length < 2) {
      setItems([]);
      setIsSearching(false);
      return;
    }

    const timerId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const result = await apiJson<TeamSearchResponse>(
          `/team/search?q=${encodeURIComponent(query)}&limit=8`,
        );

        if (!isActive) {
          return;
        }

        setItems(result.data?.items ?? []);
        setIsOpen(true);
      } catch (error) {
        if (isActive) {
          setItems([]);
        }
        console.error("Failed to load team search suggestions:", error);
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timerId);
    };
  }, [value]);

  const handleSelect = (item: EmployeeSuggestion | StoreSuggestion) => {
    setIsOpen(false);

    if (item.type === "employee") {
      navigate(
        `/manage-team/view-employee/${encodeURIComponent(item.employeeId)}`,
      );
      return;
    }

    navigate(`/manage-team/view-store/${encodeURIComponent(item.storeId)}`);
  };

  return (
    <div className={wrapperClassName} ref={rootRef}>
      <div className="relative flex-1 max-sm:w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by employee id, name, email, phone or store id"
          className="h-10.5 pl-10 text-sm"
          value={value}
          onFocus={() => {
            if (items.length > 0) {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            onValueChange(event.target.value);
            setIsOpen(true);
          }}
        />

        {isOpen && value.trim().length >= 2 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-sm px-3 py-2 border border-[#E2E8F0] bg-white shadow-lg">
            {isSearching ? (
              <div className="px-3 py-2 text-sm text-[#62748E]">
                Searching...
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#62748E]">
                No matching employee or store found
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto ">
                {items.map((item, index) => {
                  const key =
                    item.type === "employee"
                      ? `employee-${item.employeeId}`
                      : `store-${item.storeId}`;
                  const title =
                    item.type === "employee" ? item.name : item.storeName;
                  const subtitle =
                    item.type === "employee"
                      ? `${item.employeeId} | ${item.phone}${item.email ? ` | ${item.email}` : ""}`
                      : `${item.storeId} | ${item.ownerName} | ${item.ownerPhone}`;

                  return (
                    <li key={`${key}-${index}`}>
                      <button
                        type="button"
                        className="w-full border-b border-[#F1F5F9] px-3 py-2 text-left hover:bg-[#F8FAFC] "
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex items-center justify-between gap-3 ">
                          <span className="text-sm font-medium text-[#0F172B]">
                            {title}
                          </span>
                          <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#334155]">
                            {item.type === "employee" ? "Employee" : "Store"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#64748B]">
                          {subtitle}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="max-[550px]:w-full max-[550px]:mt-3">
        <Link
          to={
            activeTab === "employees"
              ? "/manage-team/add-employee"
              : "/manage-team/add-store"
          }
          className="max-[550px]:w-full h-12 ml-auto flex items-center justify-center gap-2 whitespace-nowrap px-4 bg-[#7F22FE] text-[#FFFFFF] hover:bg-[#7008E7] shadow-sm shadow-gray-600/40 rounded-[34px] min-[550px]:h-11.5 min-[550px]:min-w-42.5"
        >
          <Plus />
          <span className="md:block">
            {activeTab === "employees" ? "Add New Employee" : "Add New Store"}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default TeamEntitySearch;
