import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiJson } from "@/lib/api";
import {
  IconAddressBook,
  IconBuildingBank,
  IconBuildingStore,
  IconMapPin,
  IconMapPins,
  IconNumber,
  IconUser,
  IconUserCircle,
  IconWorld,
} from "@tabler/icons-react";
import { Download, Loader2, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type StoreDetailsResponse = {
  data: {
    storeId: string;
    storeName: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    status: "Active" | "Inactive";
    avatar: { key: string; url: string | null } | null;
    address: {
      streetAddress: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      pinCode: string | null;
    };
    bankDetails: {
      accountNumber: string | null;
      ifsc: string | null;
      bankName: string | null;
      beneficiaryName: string | null;
      upiId: string | null;
    };
    meta: {
      storeDbId: string;
      storeCreatedAt: string;
      storeUpdatedAt: string;
      userCreatedAt: string | null;
      userUpdatedAt: string | null;
    };
  };
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const maskAccountNumber = (accountNumber: string | null | undefined) => {
  if (!accountNumber) return "-";
  if (accountNumber.length <= 4) return accountNumber;
  return "x".repeat(8) + accountNumber.slice(-4);
};

const ViewStore = () => {
  const { storeID } = useParams<{ storeID: string }>();
  const [details, setDetails] = useState<StoreDetailsResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDetails = async () => {
      if (!storeID) {
        setErrorMessage("Store ID is missing from route");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const result = await apiJson<StoreDetailsResponse>(
          `/team/stores/${encodeURIComponent(storeID)}`,
        );

        if (!isActive) {
          return;
        }

        if (!result.response.ok || !result.data?.data) {
          setErrorMessage("Failed to load store details");
          setDetails(null);
          return;
        }

        setDetails(result.data.data);
      } catch (error) {
        if (isActive) {
          setErrorMessage("Failed to load store details");
          setDetails(null);
        }
        console.error("Failed to load store details:", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      isActive = false;
    };
  }, [storeID]);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7]">
            <Store className="h-6 w-6 text-white" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Store Details</h1>
            <p className="text-base font-normal text-[#62748E]">
              Complete overview of store profile and owner information
            </p>
          </div>
        </div>

        <div className="max-[550px]:mt-3 max-[550px]:w-full">
          <Button className="radius-[34px] ml-auto flex h-12 items-center gap-2 border border-[#E2E8F0] bg-[#FFFFFF] text-[#314158] shadow-sm shadow-gray-600/40 hover:border-gray-300 hover:bg-gray-100 max-[550px]:w-full min-[550px]:h-11.5 min-[550px]:w-30">
            <Download />
            <span className="md:block">Export</span>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <Card className="flex min-h-40 items-center justify-center border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-2 text-[#475367]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading store details...</span>
            </div>
          </Card>
        )}

        {!isLoading && errorMessage && (
          <Card className="min-h-40 border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#B91C1C]">
            {errorMessage}
          </Card>
        )}

        {!isLoading && !errorMessage && details && (
          <div className="space-y-5">
            <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
              <div className="border-b border-[#E2E8F0] px-6 py-5">
                <h2 className="text-lg font-semibold text-[#101928]">Your Profile</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
                <div className="border-b border-[#E2E8F0] px-6 py-6 md:border-b-0 md:border-r">
                  <div className="flex items-center gap-4 md:flex-col md:items-start">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[200px] bg-[#F1F5F9] text-xl font-semibold text-[#334155]">
                    {details.storeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#101928]">{details.storeName}</p>
                      <p className="mt-1 text-sm font-normal text-[#475367]">STORE ID: {details.storeId}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-sm text-[#475367]">Owner Name</p>
                      <p className="text-base font-semibold text-[#101928]">{details.ownerName || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#475367]">Owner Phone</p>
                      <p className="text-base font-semibold text-[#101928]">{details.ownerPhone || "-"}</p>
                    </div>

                    <div className="inline-flex flex-col items-start gap-1.5">
                      <p className="text-sm text-[#475367]">Status</p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          details.status === "Active"
                            ? "bg-[#E7F6EC] text-[#036B26]"
                            : "bg-[#FEE2E2] text-[#B91C1C]"
                        }`}
                      >
                        {details.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-[#475367]">Owner Email</p>
                      <p className="break-all text-base font-semibold text-[#101928]">{details.ownerEmail || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#475367]">Store Created At</p>
                      <p className="text-base font-semibold text-[#101928]">{formatDate(details.meta.storeCreatedAt)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#475367]">Store Updated At</p>
                      <p className="text-base font-semibold text-[#101928]">{formatDate(details.meta.storeUpdatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
                <div className="flex items-center gap-2 bg-black px-4 py-5 text-sm font-semibold text-white">
                  <IconAddressBook className="mr-1 inline h-5.5 w-5.5 text-[#98A2B3]" />
                  <span>Address Details</span>
                </div>
                <div className="space-y-6 p-6 text-sm">
                  <div className="flex items-start gap-3">
                    <IconMapPin className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Street Address</p>
                      <p className="font-medium text-[#0F172B]">{details.address.streetAddress || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconBuildingStore className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">City</p>
                      <p className="font-medium text-[#0F172B]">{details.address.city || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconMapPins className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">State</p>
                      <p className="font-medium text-[#0F172B]">{details.address.state || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconWorld className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Country</p>
                      <p className="font-medium text-[#0F172B]">{details.address.country || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconNumber className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Pin Code</p>
                      <p className="font-medium text-[#0F172B]">{details.address.pinCode || "-"}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
                <div className="flex items-center gap-2 bg-black px-4 py-5 text-sm font-semibold text-white">
                  <IconBuildingBank className="mr-1 inline h-5.5 w-5.5 text-[#98A2B3]" />
                  <span>Bank Details</span>
                </div>
                <div className="space-y-6 p-6 text-sm">
                  <div className="flex items-start gap-3">
                    <IconBuildingBank className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Account Number</p>
                      <p className="font-medium text-[#0F172B]">{maskAccountNumber(details.bankDetails.accountNumber)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconBuildingBank className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">IFSC Code</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.ifsc || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconBuildingBank className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Bank Name</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.bankName || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconBuildingBank className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">UPI ID</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.upiId || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconUser className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Beneficiary Name</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.beneficiaryName || "-"}</p>
                    </div>
                  </div>
                </div>
              </Card>

           
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStore;