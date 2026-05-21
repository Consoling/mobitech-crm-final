import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiJson } from "@/lib/api";
import {
    
    Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import toast from "react-hot-toast";

interface PartiesApi {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  purchases: { price: string | number }[];
  bankDetails?: any;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  purchaseCount: number;
  purchaseAmount: number;
}

const PartyDashboard = () => {
  const navigate = useNavigate();
  const [fetchingCustomers, setFetchingCustomers] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchCustomers = useCallback(async (signal?: AbortSignal) => {
    setFetchingCustomers(true);

    try {
      const response = await apiJson<{ parties: PartiesApi[] }>(
        "/parties/fetch-parties",
        {
        method: "GET",
        signal,
      } as RequestInit,
      );

      const apiCustomers = response.data?.parties ?? [];
      const normalized = apiCustomers.map((customer) => {
        const purchaseAmount = customer.purchases.reduce((total, purchase) => {
          const amount = Number(purchase.price ?? 0);
          return total + (Number.isFinite(amount) ? amount : 0);
        }, 0);

        return {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName ?? "",
          email: customer.email ?? "-",
          phone: customer.phone,
          purchaseCount: customer.purchases.length,
          purchaseAmount,
        };
      });

      if (normalized.length > 0) {
        setCustomers(normalized);
      } else {
        setCustomers([]);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // request was aborted (expected in StrictMode remount), ignore
        return;
      }
      toast.error("Failed to fetch parties. Please try again later.");
      console.error("Error fetching parties:", error);
    } finally {
      setFetchingCustomers(false);
    }
  }, []);
  useEffect(() => {
    document.title = "Parties - Mobitech CRM";
    const controller = new AbortController();
    void fetchCustomers(controller.signal);
    return () => controller.abort();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      return (
        customer.id.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        String(customer.purchaseCount).includes(query) ||
        String(customer.purchaseAmount).includes(query)
      );
    });
  }, [customers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + pageSize,
  );

  const fromItem = filteredCustomers.length === 0 ? 0 : startIndex + 1;
  const toItem = Math.min(startIndex + pageSize, filteredCustomers.length);

  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
        {/* Wallet Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#E60076] to-[#C6005C] flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">All Parties</h1>
            <p className="text-[#62748E] text-base font-normal">
              View all parties records
            </p>
          </div>

          
        </div>
           <div className=" max-[550px]:w-full max-[550px]:mt-3 flex items-center gap-2">
          <Button className="max-[550px]:w-full h-12 ml-auto flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0]  hover:bg-[#E60076] transition-colors transform ease-in-out delay-110 hover:border-gray-300 shadow-sm shadow-gray-600/40 radius-[34px] min-[550px]:h-11.5 min-[550px]:w-36 bg-linear-to-r from-[#C6005C] to-[#E60076] text-white " onClick={() => navigate("/clients/add-party")}>
            <Plus />
            <span className="md:block "> Add Party</span>
          </Button>
         <Button
            variant="outline"
            
            className="rounded-full border-[#D0D5DD] h-12 w-12 bg-black/10 hover:bg-black/5"
            onClick={() => void fetchCustomers()}
            disabled={fetchingCustomers}
          >
            <RefreshCw className={`h-4 w-4 ${fetchingCustomers ? "animate-spin" : ""}`} />
            
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0F172B80]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search parties..."
          className="rounded-[34px] pr-4 pl-12 py-3 bg-[#FFFFFF] text-[#0F172B80] placeholder:text-[#0F172B80] border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white shadow-sm">
       
      
        

        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="w-22.5 px-5 text-[#314158] font-bold">View</TableHead>
              <TableHead className="px-5 text-[#314158] font-bold">ID</TableHead>
              <TableHead className="px-5 text-[#314158] font-bold">Name</TableHead>
              <TableHead className="px-5 text-[#314158] font-bold">Email</TableHead>
              <TableHead className="px-5 text-[#314158] font-bold">Phone</TableHead>
              <TableHead className="px-5 text-[#314158] font-bold">Purchase Count</TableHead>
              <TableHead className="px-5 text-[#314158] font-bold">Purchase Price</TableHead>
              <TableHead className="px-5 text-right text-[#314158] font-bold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="px-5">
                      <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-[#475467] hover:bg-[#F2F4F7]"
                      onClick={() =>
                        navigate(`/clients/view-party/${customer.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="px-5 font-medium text-[#101928]">
                    PRT-{customer.id.slice(0,5).toUpperCase()}
                  </TableCell>
                  <TableCell className="px-5 text-[#101928]">
                    {`${customer.firstName} ${customer.lastName}`.trim()}
                  </TableCell>
                  <TableCell className="px-5 text-[#475467]">
                    {customer.email}
                  </TableCell>
                  <TableCell className="px-5 text-[#475467]">
                    {customer.phone}
                  </TableCell>
                  <TableCell className="px-5 text-[#101928]">
                    {customer.purchaseCount}
                  </TableCell>
                  <TableCell className="px-5 text-[#101928]">
                    {customer.purchaseAmount.toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="px-5 text-right">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-[#475467] hover:bg-[#F2F4F7]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-2" align="end">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/clients/edit-party/${customer.id}`)
                            }
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#101828] hover:bg-[#F2F4F7]"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="px-5 py-10 text-center text-sm text-[#667085]"
                >
                  {fetchingCustomers
                    ? "Loading parties..."
                    : "No parties found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#667085]">
            Showing {fromItem} to {toItem} of {filteredCustomers.length} results
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-[#D0D5DD]"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    className={
                      pageNumber === currentPage
                        ? "rounded-full bg-[#296CFF] text-white hover:bg-[#296CFF]"
                        : "rounded-full border-[#D0D5DD]"
                    }
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              className="rounded-full border-[#D0D5DD]"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyDashboard;
