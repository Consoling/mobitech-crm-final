import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import idCardTop from "@/assets/id-card-assets/id-card-top.png";
import idCardBottom from "@/assets/id-card-assets/id-card-bottom.png";
import idCardBottomBack from "@/assets/id-card-assets/id-card-bottom-back.png";
import mobitechCRMtext from "@/assets/id-card-assets/mobitech-crm.png";
import idCardBack from "@/assets/id-card-assets/id-card-back.png";
import idCardLogo from "@/assets/id-card-assets/id-card-logo.png";
import { apiJson } from "@/lib/api";
import { IconAddressBook, IconBuildingBank, IconBuildingStore, IconCalendar, IconCoinRupee, IconFile, IconId, IconIdBadge, IconIdBadge2, IconLogin2, IconPhone, IconRefresh, IconSticker2, IconUser, IconUserCircle, IconWallet, IconWorldMap } from "@tabler/icons-react";
import { ArrowLeft, ArrowRight, Download, Eye, Loader2, UsersRound } from "lucide-react";

import React, { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
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
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [idCardAvatarSrc, setIdCardAvatarSrc] = useState<string | undefined>(undefined);
  const idCardRef = useRef<HTMLDivElement | null>(null);

  const idCardBarcodeSvg = useMemo(() => {
    if (!details?.employeeId) {
      return "";
    }

   
  }, [details?.employeeId]);

  const idCardBarcodeDataUrl = useMemo(() => {
    if (!idCardBarcodeSvg) {
      return "";
    }

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(idCardBarcodeSvg)}`;
  }, [idCardBarcodeSvg]);

  useEffect(() => {
    let isActive = true;

    const loadAvatarAsDataUrl = async () => {
      const avatarUrl = details?.avatar?.url;

      if (!avatarUrl) {
        setIdCardAvatarSrc(undefined);
        return;
      }

      try {
        const response = await fetch(avatarUrl, { mode: "cors" });
        if (!response.ok) {
          throw new Error(`Avatar fetch failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          if (isActive) {
            setIdCardAvatarSrc(typeof reader.result === "string" ? reader.result : avatarUrl);
          }
        };

        reader.onerror = () => {
          if (isActive) {
            setIdCardAvatarSrc(avatarUrl);
          }
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to convert avatar for ID card:", error);
        if (isActive) {
          setIdCardAvatarSrc(avatarUrl);
        }
      }
    };

    void loadAvatarAsDataUrl();

    return () => {
      isActive = false;
    };
  }, [details?.avatar?.url]);

  const downloadIdCard = async () => {
    if (!details || !idCardRef.current) {
      return;
    }

   
  };

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
console.log("Employee details state:", details, "Loading:", isLoading, "Error:", errorMessage);
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
                    <Avatar className="h-16 w-16 rounded-[200px]">
                      <AvatarImage src={details.avatar?.url ?? undefined} alt={details.name} />
                      <AvatarFallback className="bg-[#F1F5F9] text-xl font-semibold text-[#334155]">
                        {details.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
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
                     <Button
                          variant='outline'
                          onClick={() => setIsIdCardOpen(true)}
                          className="inline-flex items-center rounded-2xl border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#101928] hover:bg-[#F8FAFC]"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View ID Card
                        </Button>
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

      <Dialog open={isIdCardOpen} onOpenChange={setIsIdCardOpen}>
        <DialogContent showCloseButton={false} className="max-w-190 rounded-[28px] border border-[#D0D5DD] bg-[#F8FAFC] p-5 sm:p-6">
          <DialogTitle className="text-center text-[28px] font-medium text-[#101928] sm:text-[32px]">ID Card</DialogTitle>

          <div className="mt-2 rounded-[22px] border border-[#D0D5DD] bg-[#EFF2F6] p-4 sm:p-6">
            <div ref={idCardRef} data-id-card-export="true" className="relative mx-auto w-51 h-80.5 overflow-hidden rounded-[14px] bg-white shadow-sm">
              <img
                src={idCardBack}
                alt="ID card background"
                className="absolute top-1.5 object-cover"
              />
              <img
                src={idCardTop}
                alt="ID card top artwork"
                className="absolute left-0 top-0 h-28.75 w-full object-cover"
              />
              <img
                src={idCardBottomBack}
                alt="ID card bottom artwork"
                className="absolute bottom-1 left-0 h-auto w-full object-cover"
              />
              <img
                src={idCardBottom}
                alt="ID card bottom artwork"
                className="absolute bottom-0 left-0 h-auto w-full object-cover"
              />

              <div className="relative z-10 flex min-h-80.5 flex-col px-4 pb-4 pt-3">
                <div className="flex-col items-center  flex gap-1">
                  <img src={idCardLogo} alt="Mobitech logo" className="h-5.5 w-6.75 object-contain" />
                  <img src={mobitechCRMtext} alt="Mobitech CRM" className="h-[28.37px] w-[82.47px] object-contain" />
                </div>

                <div className=" flex justify-center" style={{ marginTop: "6px" }}>
                  <Avatar className="h-20 w-20 border-4 border-[#F79009] bg-white">
                    <AvatarImage src={idCardAvatarSrc ?? details?.avatar?.url ?? undefined} alt={details?.name ?? "Employee"} />
                    <AvatarFallback className="bg-[#F1F5F9] text-xl font-semibold text-[#334155]">
                      {details?.name?.charAt(0).toUpperCase() ?? "E"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-5 text-center">
                  <p className="text-[10px] font-semibold text-[#F19118]">{details?.position || "-"}</p>
                </div>

                <div className="space-y-0.5 text-left text-[8px] leading-tight text-[#000000]" style={{ marginTop: "12px" }}>
                  <div className="grid grid-cols-[38px_1fr] items-center gap-0">
                    <p className="text-left font-semibold uppercase text-[#F19118]">ID NO</p>
                    <p className="text-left">: {details?.employeeId || "-"}</p>
                  </div>
                  <div className="grid grid-cols-[38px_1fr] items-center gap-0">
                    <p className="text-left font-semibold uppercase text-[#F19118]">DOB</p>
                    <p className="text-left">: DD/MM/YEAR</p>
                  </div>
                  <div className="grid grid-cols-[38px_1fr] items-center gap-0">
                    <p className="text-left font-semibold uppercase text-[#F19118]">Blood</p>
                    <p className="text-left">: A+</p>
                  </div>
                  <div className="grid grid-cols-[38px_1fr] items-center gap-0">
                    <p className="text-left font-semibold uppercase text-[#F19118]">Phone</p>
                    <p className="text-left">: {details?.phone || "-"}</p>
                  </div>
                  <div className="grid grid-cols-[38px_1fr] items-center gap-0">
                    <p className="text-left font-semibold uppercase tracking-wide text-[#F19118]">E-mail</p>
                    <p className="text-left break-all">: {details?.email || "-"}</p>
                  </div>
                </div>

                <div className="flex justify-center pb-2" style={{ marginTop: "auto" }}>
                  {idCardBarcodeDataUrl ? (
                    <img
                      src={idCardBarcodeDataUrl}
                      alt={`Barcode for employee ID ${details?.employeeId || ""}`}
                      className="h-5 w-31 max-w-35 object-contain"
                    />
                  ) : (
                    <div className="flex min-h-13 w-full max-w-35 items-center justify-center rounded-sm bg-white px-1 text-[9px] text-[#64748B]">
                      Barcode unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-[#D0D5DD] bg-white text-[#98A2B3]" disabled>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-[#D0D5DD] bg-white text-[#98A2B3]" disabled>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={() => setIsIdCardOpen(false)}
              className="h-10 rounded-full bg-black text-lg font-medium text-white hover:bg-[#111111]"
            >
              <ArrowLeft className="ml-1 h-5 w-5" />
              Go Back
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                void downloadIdCard();
              }}
              className="h-10 rounded-full border border-[#667085] bg-[#F8FAFC] text-lg font-medium text-[#101928] hover:bg-[#EEF2F7]"
            >
              <Download className="h-5 w-5" />
              Download ID Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewEmployee;