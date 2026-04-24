import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiJson } from "@/lib/api";
import { IconAddressBook, IconBuildingBank, IconBuildingStore, IconCalendar, IconCoinRupee, IconFile, IconId, IconIdBadge, IconIdBadge2, IconLogin2, IconPhone, IconRefresh, IconSticker2, IconUser, IconUserCircle, IconWallet, IconWorldMap } from "@tabler/icons-react";
import { Download, Eye, Loader2, UsersRound } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type EmployeeDetailsResponse = {
  data: {
    employeeId: string;
    name: string;
    position: string;
    status: "Active" | "Inactive";
    email: string | null;
    phone: string;
    avatar: { key: string; url: string | null } | null;
    personalDetails: {
      firstName: string | null;
      lastName: string | null;
      aadharId: string | null;
      dateOfJoining: string | null;
      dateOfTermination: string | null;
    };
    employmentDetails: {
      salary: string | null;
      payoutDate: number | null;
      storeId: string | null;
      createdBy: string | null;
      createdAt: string;
      updatedAt: string;
    };
    bankDetails: {
      accountNumber: string | null;
      ifsc: string | null;
      bankName: string | null;
      beneficiaryName: string | null;
      upiId: string | null;
    };
    documents: {
      aadharFront: { key: string; url: string | null } | null;
      aadharBack: { key: string; url: string | null } | null;
      qualification: { key: string; url: string | null } | null;
      agreement: { key: string; url: string | null } | null;
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

const ViewEmployee = () => {
  const { employeeID } = useParams<{ employeeID: string }>();
  const [details, setDetails] = useState<EmployeeDetailsResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDetails = async () => {
      if (!employeeID) {
        setErrorMessage("Employee ID is missing from route");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const result = await apiJson<EmployeeDetailsResponse>(
          `/team/employees/${encodeURIComponent(employeeID)}`,
        );

        if (!isActive) {
          return;
        }

        if (!result.response.ok || !result.data?.data) {
          setErrorMessage("Failed to load employee details");
          setDetails(null);
          return;
        }

        setDetails(result.data.data);
      } catch (error) {
        if (isActive) {
          setErrorMessage("Failed to load employee details");
          setDetails(null);
        }
        console.error("Failed to load employee details:", error);
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
  }, [employeeID]);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7]">
            <UsersRound className="h-6 w-6 text-white" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Employee Details</h1>
            <p className="text-base font-normal text-[#62748E]">
              Complete overview of employee details and work information
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
              <span>Loading employee details...</span>
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
                      {details.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#101928]">{details.name}</p>
                      <p className="text-sm mt-1 text-[#475367] font-normal">EMP. ID: {details.employeeId}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-sm text-[#475367]">Position</p>
                      <p className="text-base font-semibold text-[#101928]">{details.position}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#475367]">Phone Number</p>
                      <p className="text-base font-semibold text-[#101928]">{details.phone || "-"}</p>
                    </div>

                    <div className="inline-flex flex-col items-start gap-1.5" >
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
                      <p className="text-sm text-[#475367]">Email</p>
                      <p className="break-all text-base font-semibold text-[#101928]">{details.email || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-[#475367]">Date of Joining</p>
                      <p className="text-base font-semibold text-[#101928]">{formatDate(details.personalDetails.dateOfJoining)}</p>
                    </div>

                    <div className="inline-flex flex-col items-start gap-1.5">
                      <p className="text-sm text-[#475367]">ID Card</p>
                     <Link
                          to={''}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-2xl border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#101928] hover:bg-[#F8FAFC]"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View ID Card
                        </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
               <div className="bg-black px-4 py-5 text-sm font-semibold text-white items-center flex gap-2">
                  <IconAddressBook className="mr-1 inline h-5.5 w-5.5 text-[#98A2B3]" />
                  <span>Personal Details</span></div>
                <div className="space-y-6 p-6 text-sm">
                  <div className="flex items-start gap-3">
                    <IconPhone className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">First Name</p>
                      <p className="font-medium text-[#0F172B] text-sm">{details.personalDetails.firstName || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconUser className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Last Name</p>
                      <p className="font-medium text-[#0F172B]">{details.personalDetails.lastName || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconIdBadge2 className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Aadhar ID</p>
                      <p className="font-medium text-[#0F172B]">{details.personalDetails.aadharId || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconLogin2 className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Date of Joining</p>
                      <p className="font-medium text-[#0F172B]">{formatDate(details.personalDetails.dateOfJoining)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCalendar className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Date of Termination</p>
                      <p className="font-medium text-[#0F172B]">{formatDate(details.personalDetails.dateOfTermination)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
               <div className="bg-black px-4 py-5 text-sm font-semibold text-white items-center flex gap-2">
                  <IconUserCircle className="mr-1 inline h-5.5 w-5.5 text-[#98A2B3]" />
                  <span>Employee Details</span></div>
                <div className="space-y-6 p-6 text-sm">
                  <div className="flex items-start gap-3">
                    <IconWallet className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Salary</p>
                      <p className="font-medium text-[#0F172B]">{details.employmentDetails.salary ? `Rs ${details.employmentDetails.salary}` : "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCoinRupee className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Payout Date</p>
                      <p className="font-medium text-[#0F172B]">{details.employmentDetails.payoutDate ?? "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconBuildingStore className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Store ID</p>
                      <p className="font-medium text-[#0F172B]">{details.employmentDetails.storeId || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconUser className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Created By</p>
                      <p className="font-medium text-[#0F172B]">{details.employmentDetails.createdBy || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconWorldMap className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Created At</p>
                      <p className="font-medium text-[#0F172B]">{formatDate(details.employmentDetails.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconRefresh className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Updated At</p>
                      <p className="font-medium text-[#0F172B]">{formatDate(details.employmentDetails.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
              <div className="bg-black px-4 py-5 text-sm font-semibold text-white items-center flex gap-2">
                  <IconBuildingBank className="mr-1 inline h-5.5 w-5.5 text-[#98A2B3]" />
                  <span>Bank Details</span></div>
                <div className="space-y-6 p-6 text-sm">
                  <div className="flex items-start gap-3">
                    <IconBuildingBank className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Account Number</p>
                      <p className="font-medium text-[#0F172B]">{maskAccountNumber(details.bankDetails.accountNumber)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconSticker2 className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">IFSC Code</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.ifsc || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconUser className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Bank Name</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.bankName || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconId className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">UPI ID</p>
                      <p className="font-medium text-[#0F172B]">{details.bankDetails.upiId || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconUser  className="mt-1 h-5 w-5 text-[#98A2B3]" />
                    <div>
                      <p className="text-xs text-[#64748B]">Beneficiary Name</p>
                      <p className="font-medium text-[#AD3307]">{details.bankDetails.beneficiaryName || "-"}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="gap-0 overflow-hidden border border-[#E2E8F0] bg-white py-0">
                <div className="bg-black px-4 py-5 text-sm font-semibold text-white items-center flex gap-2">
                  <IconFile className="mr-1 inline h-5.5 w-5.5 text-[#98A2B3]" />
                  <span>Documents</span></div>
                <div className="space-y-6 p-6 text-sm">
                  {[
                    { label: "Aadhar Front", value: details.documents.aadharFront, icon: IconIdBadge },
                    { label: "Aadhar Back", value: details.documents.aadharBack, icon: IconIdBadge2 },
                    { label: "Qualification", value: details.documents.qualification, icon: IconIdBadge2 },
                    { label: "Agreement", value: details.documents.agreement, icon: IconIdBadge2 },
                  ].map((document) => (
                    <div key={document.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {React.createElement(document.icon, { className: "mt-1 h-5  w-5 text-[#98A2B3]" })}
                        <div>
                          <p className="text-xs text-[#64748B]">{document.label}</p>
                          <p className="font-medium text-[#0F172B]">
                            {document.value?.url ? "View document" : "Not uploaded"}
                          </p>
                        </div>
                      </div>
                      {document.value?.url && (
                        <a
                          href={document.value.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-[#E2E8F0] px-3 py-1 text-xs font-medium text-[#0F172B] hover:bg-[#F8FAFC]"
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewEmployee;