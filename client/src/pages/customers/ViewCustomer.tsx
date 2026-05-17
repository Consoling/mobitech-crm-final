
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiJson } from "@/lib/api";
import { Loader2, UserCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

type Purchase = {
  id: string;
  model: string;
  imei: string;
  purchaseDate: string;
  price: string | number;
};

type CustomerDetails = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  purchases: Purchase[];
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatAmount = (value: string | number) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
};

const ViewCustomer = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);

  useEffect(() => {
    let active = true;

    const loadCustomer = async () => {
      if (!customerId) {
        toast.error("Customer ID is missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { response, data } = await apiJson<{ customer?: CustomerDetails }>(
          `/customers/${encodeURIComponent(customerId)}`,
        );

        if (!response.ok || !data?.customer) {
          toast.error("Failed to load customer details");
          return;
        }

        if (!active) return;
        setCustomer(data.customer);
      } catch (error) {
        console.error("load customer error", error);
        toast.error("Failed to load customer details");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadCustomer();

    return () => {
      active = false;
    };
  }, [customerId]);

  const totalPurchaseAmount = useMemo(() => {
    if (!customer?.purchases?.length) return 0;
    return customer.purchases.reduce((total, purchase) => {
      const amount = Number(purchase.price);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [customer?.purchases]);

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <Card className="flex min-h-40 items-center justify-center border border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-2 text-[#475367]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading customer details...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="px-6 py-6">
        <Card className="border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#B91C1C]">
          Customer not found.
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#E60076] to-[#C6005C]">
            <UserCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">View Customer</h1>
            <p className="text-base font-normal text-[#62748E]">
              Customer profile and purchase summary
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <Card className="w-full rounded-[16px] border border-[#E2E8F0] p-6 shadow-none">
          <h2 className="mb-5 text-lg font-semibold text-[#101928]">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[#667085]">First Name</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.firstName || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#667085]">Last Name</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.lastName || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#667085]">Email</p>
              <p className="mt-1 break-all text-base font-semibold text-[#101928]">
                {customer.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#667085]">Phone Number</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.phone || "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="w-full rounded-[16px] border border-[#E2E8F0] p-6 shadow-none">
          <h2 className="mb-5 text-lg font-semibold text-[#101928]">
            Address Information
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[#667085]">Street Address</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.streetAddress || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#667085]">Area</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.area || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#667085]">City</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.city || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#667085]">State</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.state || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-[#667085]">PIN Code</p>
              <p className="mt-1 text-base font-semibold text-[#101928]">
                {customer.pinCode || "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="w-full rounded-[16px] border border-[#E2E8F0] p-6 shadow-none">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#101928]">Purchases</h2>
            <div className="text-sm text-[#475467]">
              <span className="font-medium">Total Purchases:</span>{" "}
              {customer.purchases?.length ?? 0} |{" "}
              <span className="font-medium">Total Amount:</span>{" "}
              {formatAmount(totalPurchaseAmount)}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.purchases?.length ? (
                customer.purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.model || "-"}</TableCell>
                    <TableCell>{purchase.imei || "-"}</TableCell>
                    <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatAmount(purchase.price)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-[#667085]"
                  >
                    No purchase records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default ViewCustomer;