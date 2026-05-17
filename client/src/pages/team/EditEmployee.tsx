import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiJson, jsonHeaders } from "@/lib/api";
import toast from "react-hot-toast";
import { UsersRound } from "lucide-react";
import { Edit, Loader2, Download, ChevronsUpDown, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { BANK_NAMES } from "@/constants/const";
import { useMemo } from "react";

type EmployeeDetailsResponse = {
  data: {
    employeeId: string;
    name: string;
    position: string;
    status: "Active" | "Inactive" | "Terminated";
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
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
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

const EditEmployee = () => {
  const { employeeID } = useParams<{ employeeID: string }>();
  const [details, setDetails] = useState<
    EmployeeDetailsResponse["data"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Per-card edit toggles
  const [personalEdit, setPersonalEdit] = useState(false);
  const [employmentEdit, setEmploymentEdit] = useState(false);
  const [bankEdit, setBankEdit] = useState(false);

  // Form state mirroring details
  const [form, setForm] = useState<any>({});

  // Phone verification dialog state
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // Bank verification state
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState<string | null>(null);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  // Bank combobox state reused from AddEmployee
  const [isBankComboboxOpen, setIsBankComboboxOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const bankOptions = useMemo(
    () =>
      BANK_NAMES.map((bank) => ({
        label: bank,
        value: bank.toLowerCase().replace(/\s+/g, "-"),
      })),
    [],
  );

  const filteredBankOptions = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();
    if (!query) return bankOptions;
    return bankOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [bankOptions, bankSearch]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!employeeID) {
        setErrorMessage("Employee ID is missing from route");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await apiJson<EmployeeDetailsResponse>(
          `/team/employees/${encodeURIComponent(employeeID!)}`,
        );
        if (!active) return;
        if (!res.response.ok || !res.data?.data) {
          setErrorMessage("Failed to load employee details");
          setDetails(null);
          return;
        }
        setDetails(res.data.data);
        setForm(res.data.data);
      } catch (err) {
        console.error(err);
        if (active) {
          setErrorMessage("Failed to load employee details");
          setDetails(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [employeeID]);

  // Phone verification flow (reuses AddEmployee endpoints)
  const sendPhoneOtp = async (phone: string) => {
    setSendingOtp(true);
    try {
      const res = await apiJson(`/team/add-employee/send-otp`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ identifier: phone }),
      });
      if (res.response.ok) {
        setOtpSent(true);
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (err) {
      console.error("sendPhoneOtp error", err);
      setOtpSent(false);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyPhoneOtp = async (phone: string) => {
    try {
      const res = await apiJson(`/team/add-employee/verify-otp`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ identifier: phone, otp: otpValue }),
      });
      if (res.response.ok) {
        // mark phone verified in form and close dialog
        setForm((f: any) => ({ ...f, phoneVerified: true }));
        setPhoneVerifyOpen(false);
        setOtpValue("");
        setOtpSent(false);
      } else {
        throw new Error("OTP verification failed");
      }
    } catch (err) {
      console.error("verifyPhoneOtp error", err);
      // keep dialog open for user to retry
    }
  };

  const handleFieldChange = (path: string, value: any) => {
    setForm((f: any) => {
      const next = { ...f };
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = cur[p] ?? {};
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  // verify bank details using AddEmployee verify endpoint
  const verifyBank = async () => {
    const ifsc = form.bankDetails?.ifsc?.trim();
    const accountNumber = form.bankDetails?.accountNumber?.trim();
    if (!ifsc) {
      toast.error("Please enter IFSC code");
      return;
    }
    if (!accountNumber) {
      toast.error("Please enter account number");
      return;
    }

    setIsVerifyingBank(true);
    try {
      const { data } = await apiJson<{
        status?: string;
        data?: any;
        message?: string;
      }>(`/team/add-employee/verify-bank`, {
        method: "POST",
        body: JSON.stringify({ ifsc, id_number: accountNumber }),
        headers: { "Content-Type": "application/json" },
      });

      if (data?.status === "success" && data?.data?.account_exists) {
        const nameAtBank = data.data.name_at_bank || data.data.full_name;
        setBeneficiaryName(nameAtBank || null);
        setForm((f: any) => ({
          ...f,
          bankDetails: {
            ...(f.bankDetails || {}),
            beneficiaryName: nameAtBank,
          },
          isBankVerified: true,
        }));
        toast.success("Bank details verified successfully");
      } else {
        toast.error(
          data?.message ||
            "Failed to verify bank details. Please check and try again.",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify bank details. Please try again.");
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const verifyUpi = async () => {
    const upiId = form.bankDetails?.upiId?.trim();
    if (!upiId) {
      toast.error("Please enter UPI ID");
      return;
    }

    setIsVerifyingUpi(true);
    try {
      const { data } = await apiJson<{
        status?: string;
        data?: any;
        message?: string;
      }>(`/team/add-employee/verify-upi`, {
        method: "POST",
        body: JSON.stringify({ upi_id: upiId }),
        headers: { "Content-Type": "application/json" },
      });

      if (data?.status === "success" && data?.data?.account_exists) {
        const nameAtBank = data.data.name_at_bank || data.data.full_name;
        setBeneficiaryName(nameAtBank || null);
        setForm((f: any) => ({
          ...f,
          bankDetails: {
            ...(f.bankDetails || {}),
            beneficiaryName: nameAtBank,
          },
          isUpiVerified: true,
        }));
        toast.success("UPI details verified successfully");
      } else {
        toast.error(
          data?.message ||
            "Failed to verify UPI details. Please check and try again.",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify UPI details. Please try again.");
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  // Combined save for all sections
  const saveAll = async () => {
    if (!details) return;

    // If bank or UPI details present and not verified, block save
    const bankProvided = form.bankDetails && form.bankDetails.accountNumber;
    const upiProvided = form.bankDetails && form.bankDetails.upiId;
    if (
      (bankProvided && !form.isBankVerified) ||
      (upiProvided && !form.isUpiVerified)
    ) {
      toast.error("Please verify bank/UPI details before saving.");
      return;
    }

    const payload: any = {
      firstName: form.personalDetails?.firstName,
      lastName: form.personalDetails?.lastName,
      aadharId: form.personalDetails?.aadharId,
      dateOfJoining: form.personalDetails?.dateOfJoining,
      dateOfTermination: form.personalDetails?.dateOfTermination,
      email: form.email,
      phone: form.phone,
      salary: form.employmentDetails?.salary,
      payoutDate: form.employmentDetails?.payoutDate,
      storeId: form.employmentDetails?.storeId,
      bankName: form.bankDetails?.bankName,
      accountNumber: form.bankDetails?.accountNumber,
      ifsc: form.bankDetails?.ifsc,
      beneficiaryName: form.bankDetails?.beneficiaryName || beneficiaryName,
      upiId: form.bankDetails?.upiId,
    };

    try {
      const res = await apiJson(
        `/team/employees/${encodeURIComponent(employeeID!)}`,
        {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify(payload),
        },
      );
      if (res.response.ok) {
        toast.success("Employee updated successfully");
        // refresh details
        const refreshed = await apiJson<EmployeeDetailsResponse>(
          `/team/employees/${encodeURIComponent(employeeID!)}`,
        );
        if (refreshed.response.ok && refreshed.data?.data) {
          setDetails(refreshed.data.data);
          setForm(refreshed.data.data);
        }
        setPersonalEdit(false);
        setEmploymentEdit(false);
        setBankEdit(false);
      } else {
        toast.error("Failed to save changes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
    }
  };

  const cancelAll = () => {
    if (details) {
      setForm(details);
    }
    setPersonalEdit(false);
    setEmploymentEdit(false);
    setBankEdit(false);
    toast.dismiss();
  };

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <Card className="flex min-h-40 items-center justify-center border border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-2 text-[#475367]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading employee details...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="px-6 py-6">
        <Card className="min-h-40 border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#B91C1C]">
          {errorMessage ?? "Employee not found"}
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7]">
            <UsersRound className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Edit Employee</h1>
            <p className="text-base font-normal text-[#62748E]">
              Edit employee details{" "}
            </p>
          </div>
        </div>
        <div>
          <Button className="radius-[34px] ml-auto flex h-12 items-center gap-2 border border-[#E2E8F0] bg-[#FFFFFF] text-[#314158] shadow-sm shadow-gray-600/40 hover:border-gray-300 hover:bg-gray-100">
            <Download />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <Card className="gap-0 overflow-hidden border border-[#E2E8F0]  py-0">
          <div className="border-b border-[#E2E8F0] px-6 py-5 flex items-center bg-[#101928] justify-between">
            <h2 className="text-lg font-semibold text-[#ffffff]">
              Personal Details
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPersonalEdit((s) => !s)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
            <div className="border-b border-[#E2E8F0] px-6 py-6 md:border-b-0 md:border-r">
              <div className="flex items-center gap-4 md:flex-col md:items-start">
                <Avatar className="h-16 w-16 rounded-[200px]">
                  <AvatarImage
                    src={details.avatar?.url ?? undefined}
                    alt={details.name}
                  />
                  <AvatarFallback className="bg-[#F1F5F9] text-xl font-semibold text-[#334155]">
                    {details.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-[#101928]">
                    {details.name}
                  </p>
                  <p className="text-sm mt-1 text-[#475367] font-normal">
                    EMP. ID: {details.employeeId}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="text-sm text-[#475367]">First Name</p>
                  {personalEdit ? (
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.personalDetails?.firstName ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "personalDetails.firstName",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <p className="text-base font-semibold text-[#101928]">
                      {details.personalDetails.firstName || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#475367]">Last Name</p>
                  {personalEdit ? (
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.personalDetails?.lastName ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "personalDetails.lastName",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <p className="text-base font-semibold text-[#101928]">
                      {details.personalDetails.lastName || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#475367]">Phone Number</p>
                  {personalEdit ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-2"
                        value={form.phone ?? ""}
                        onChange={(e) =>
                          handleFieldChange("phone", e.target.value)
                        }
                      />
                      <Button
                        onClick={() => {
                          setPhoneVerifyOpen(true);
                          void sendPhoneOtp(form.phone ?? "");
                        }}
                      >
                        Verify
                      </Button>
                    </div>
                  ) : (
                    <p className="text-base font-semibold text-[#101928]">
                      {details.phone || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#475367]">Email</p>
                  {personalEdit ? (
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.email ?? ""}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                    />
                  ) : (
                    <p className="break-all text-base font-semibold text-[#101928]">
                      {details.email || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#475367]">Date of Joining</p>
                  {personalEdit ? (
                    <input
                      type="date"
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.personalDetails?.dateOfJoining ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "personalDetails.dateOfJoining",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <p className="text-base font-semibold text-[#101928]">
                      {formatDate(details.personalDetails.dateOfJoining)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#475367]">Date of Termination</p>
                  {personalEdit ? (
                    <input
                      type="date"
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.personalDetails?.dateOfTermination ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "personalDetails.dateOfTermination",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <p className="text-base font-semibold text-[#101928]">
                      {formatDate(details.personalDetails.dateOfTermination)}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 xl:col-span-1 flex items-end">
                  {/* per-card save removed — use final Save/Cancel */}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden border border-[#E2E8F0]  py-0">
          <div className="border-b border-[#E2E8F0] px-6 py-5 flex items-center  bg-[#101928] justify-between">
            <h2 className="text-lg font-semibold text-[#ffffff]">
              Employment Details
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEmploymentEdit((s) => !s)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="text-sm text-[#475367]">Salary</p>
                {employmentEdit ? (
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.employmentDetails?.salary ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "employmentDetails.salary",
                        e.target.value,
                      )
                    }
                  />
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {details.employmentDetails.salary
                      ? `Rs ${details.employmentDetails.salary}`
                      : "-"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">Payout Date</p>
                {employmentEdit ? (
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.employmentDetails?.payoutDate ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "employmentDetails.payoutDate",
                        Number(e.target.value),
                      )
                    }
                  />
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {details.employmentDetails.payoutDate ?? "-"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">Store ID</p>
                {employmentEdit ? (
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.employmentDetails?.storeId ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "employmentDetails.storeId",
                        e.target.value,
                      )
                    }
                  />
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {details.employmentDetails.storeId || "-"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">Created By</p>
                <p className="text-base font-semibold text-[#101928]">
                  {details.employmentDetails.createdBy || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#475367]">Created At</p>
                <p className="text-base font-semibold text-[#101928]">
                  {formatDate(details.employmentDetails.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#475367]">Updated At</p>
                <p className="text-base font-semibold text-[#101928]">
                  {formatDate(details.employmentDetails.updatedAt)}
                </p>
              </div>

              {/* per-card save removed — use final Save/Cancel */}
            </div>
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden border border-[#E2E8F0]  py-0">
          <div className="border-b border-[#E2E8F0] px-6 py-5 flex items-center bg-[#101928] justify-between">
            <h2 className="text-lg font-semibold text-[#ffffff]">
              Bank Details
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setBankEdit((s) => !s)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="text-sm text-[#475367]">Account Number</p>
                {bankEdit ? (
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.bankDetails?.accountNumber ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "bankDetails.accountNumber",
                        e.target.value,
                      )
                    }
                  />
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {maskAccountNumber(details.bankDetails.accountNumber)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">IFSC Code</p>
                {bankEdit ? (
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.bankDetails?.ifsc ?? ""}
                    onChange={(e) =>
                      handleFieldChange("bankDetails.ifsc", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {details.bankDetails.ifsc || "-"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">Bank Name</p>
                {bankEdit ? (
                  <Popover
                    open={isBankComboboxOpen}
                    onOpenChange={(isOpen) => {
                      setIsBankComboboxOpen(isOpen);
                      if (!isOpen) setBankSearch("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={isBankComboboxOpen}
                        className="h-14 w-full max-w-127.5 justify-between gap-3 rounded-[6px] border border-[#D0D5DD] px-4 py-4 font-normal"
                      >
                        <span
                          className={
                            form.bankDetails?.bankName
                              ? "text-[#101828]"
                              : "text-[#98A2B3]"
                          }
                        >
                          {
                            bankOptions.find(
                              (option) => option.value === form.bankDetails?.bankName,
                            )?.label ?? form.bankDetails?.bankName ?? "Select bank"
                          }
                        </span>
                        <ChevronsUpDown className="h-4 w-4 text-[#667085]" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-127.5 max-w-[calc(100vw-48px)] p-2 rounded-[10px]" align="start">
                      <Input
                        value={bankSearch}
                        onChange={(event) => setBankSearch(event.target.value)}
                        placeholder="Search bank"
                        className="h-10 border-[#D0D5DD]"
                      />

                      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                        {filteredBankOptions.length > 0 ? (
                          filteredBankOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                handleFieldChange("bankDetails.bankName", option.value);
                                setIsBankComboboxOpen(false);
                                setBankSearch("");
                              }}
                              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[#101828] hover:bg-[#F2F4F7]"
                            >
                              <span>{option.label}</span>
                              {form.bankDetails?.bankName === option.value && (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-[#98A2B3]">No banks found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {details.bankDetails.bankName || "-"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">UPI ID</p>
                {bankEdit ? (
                  <div>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.bankDetails?.upiId ?? ""}
                      onChange={(e) =>
                        handleFieldChange("bankDetails.upiId", e.target.value)
                      }
                    />
                    <div className="mt-2">
                      <Button
                        type="button"
                        disabled={isVerifyingUpi || form.isUpiVerified}
                        onClick={async () => {
                          await verifyUpi();
                        }}
                        className="h-9 w-36 rounded-[10px] bg-[#00C950] px-4 text-sm font-semibold text-white hover:bg-[#29ca4c] disabled:cursor-not-allowed"
                      >
                        {isVerifyingUpi ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : form.isUpiVerified ? (
                          "UPI ID Verified"
                        ) : (
                          "Verify UPI Id"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base font-semibold text-[#101928]">
                    {details.bankDetails.upiId || "-"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[#475367]">Beneficiary Name</p>
                {bankEdit ? (
                  <input
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.bankDetails?.beneficiaryName ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "bankDetails.beneficiaryName",
                        e.target.value,
                      )
                    }
                  />
                ) : (
                  <p className="text-base font-semibold text-[#AD3307]">
                    {details.bankDetails.beneficiaryName || "-"}
                  </p>
                )}
              </div>

              {bankEdit ? (
                <div className="sm:col-span-2 xl:col-span-1 flex items-center justify-center">
                  <Button
                    type="button"
                    disabled={isVerifyingBank || form.isBankVerified}
                    onClick={async () => {
                      await verifyBank();
                    }}
                    className="h-9 w-48 rounded-[10px] bg-[#00C950] px-6 text-sm font-semibold text-white hover:bg-[#29ca4c] disabled:cursor-not-allowed"
                  >
                    {isVerifyingBank ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : form.isBankVerified ? (
                      "Bank Account Verified"
                    ) : (
                      "Verify Bank Account"
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Phone verification dialog */}
        <Dialog open={phoneVerifyOpen} onOpenChange={setPhoneVerifyOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle>Verify Phone Number</DialogTitle>
            <div className="p-4">
              <p className="mb-2 text-sm">
                An OTP will be sent to the phone number you entered:{" "}
                <strong>{form.phone}</strong>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => void sendPhoneOtp(form.phone ?? "")}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </Button>
                {otpSent && (
                  <input
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    placeholder="Enter OTP"
                    className="ml-2 rounded-md border px-3 py-2"
                  />
                )}
              </div>
              {otpSent && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => void verifyPhoneOtp(form.phone ?? "")}>
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {/* Final Save / Cancel actions */}
        <div className="mt-6 flex items-center justify-end gap-6">
          <Button
            variant="outline"
            className="rounded-xl py-4 px-6"
            onClick={cancelAll}
          >
            Cancel
          </Button>
          <Button
            onClick={saveAll}
            className="bg-[#296CFF] text-white hover:bg-[#296CFF] rounded-xl py-4 px-6"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;
