import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiJson } from "@/lib/api";
import { Download, Loader2, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
            <Card className="border border-[#E2E8F0] bg-white p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 md:col-span-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] text-lg font-semibold text-[#334155]">
                    {details.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#0F172B]">{details.name}</p>
                    <p className="text-sm text-[#64748B]">EMP ID: {details.employeeId}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">Position</p>
                  <p className="text-sm font-medium text-[#0F172B]">{details.position}</p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">Phone Number</p>
                  <p className="text-sm font-medium text-[#0F172B]">{details.phone || "-"}</p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">Status</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      details.status === "Active"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#FEE2E2] text-[#B91C1C]"
                    }`}
                  >
                    {details.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">Email</p>
                  <p className="break-all text-sm font-medium text-[#0F172B]">{details.email || "-"}</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card className="overflow-hidden border border-[#E2E8F0] bg-white">
                <div className="bg-black px-4 py-3 text-sm font-semibold text-white">Personal Details</div>
                <div className="space-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs text-[#64748B]">First Name</p>
                    <p className="font-medium text-[#0F172B]">{details.personalDetails.firstName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Last Name</p>
                    <p className="font-medium text-[#0F172B]">{details.personalDetails.lastName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Aadhar ID</p>
                    <p className="font-medium text-[#0F172B]">{details.personalDetails.aadharId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Date of Joining</p>
                    <p className="font-medium text-[#0F172B]">{formatDate(details.personalDetails.dateOfJoining)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Date of Termination</p>
                    <p className="font-medium text-[#0F172B]">{formatDate(details.personalDetails.dateOfTermination)}</p>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border border-[#E2E8F0] bg-white">
                <div className="bg-black px-4 py-3 text-sm font-semibold text-white">Employment Details</div>
                <div className="space-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs text-[#64748B]">Salary</p>
                    <p className="font-medium text-[#0F172B]">{details.employmentDetails.salary ? `Rs ${details.employmentDetails.salary}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Payout Date</p>
                    <p className="font-medium text-[#0F172B]">{details.employmentDetails.payoutDate ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Store ID</p>
                    <p className="font-medium text-[#0F172B]">{details.employmentDetails.storeId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Created By</p>
                    <p className="font-medium text-[#0F172B]">{details.employmentDetails.createdBy || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Created At</p>
                    <p className="font-medium text-[#0F172B]">{formatDate(details.employmentDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Updated At</p>
                    <p className="font-medium text-[#0F172B]">{formatDate(details.employmentDetails.updatedAt)}</p>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border border-[#E2E8F0] bg-white">
                <div className="bg-black px-4 py-3 text-sm font-semibold text-white">Bank Details</div>
                <div className="space-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs text-[#64748B]">Account Number</p>
                    <p className="font-medium text-[#0F172B]">{details.bankDetails.accountNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">IFSC Code</p>
                    <p className="font-medium text-[#0F172B]">{details.bankDetails.ifsc || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Bank Name</p>
                    <p className="font-medium text-[#0F172B]">{details.bankDetails.bankName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">UPI ID</p>
                    <p className="font-medium text-[#0F172B]">{details.bankDetails.upiId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Beneficiary Name</p>
                    <p className="font-medium text-[#0F172B]">{details.bankDetails.beneficiaryName || "-"}</p>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border border-[#E2E8F0] bg-white">
                <div className="bg-black px-4 py-3 text-sm font-semibold text-white">Documents</div>
                <div className="space-y-4 p-4 text-sm">
                  {[
                    { label: "Aadhar Front", value: details.documents.aadharFront },
                    { label: "Aadhar Back", value: details.documents.aadharBack },
                    { label: "Qualification", value: details.documents.qualification },
                    { label: "Agreement", value: details.documents.agreement },
                  ].map((document) => (
                    <div key={document.label} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#64748B]">{document.label}</p>
                        <p className="font-medium text-[#0F172B]">
                          {document.value?.url ? "View document" : "Not uploaded"}
                        </p>
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