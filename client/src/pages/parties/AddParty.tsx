import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiJson, jsonHeaders } from "@/lib/api";
import { UserCircle, Loader2 } from "lucide-react";
import { BANK_NAMES } from "@/constants/const";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddParty = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    area: "",
    city: "",
    state: "",
    pinCode: "",
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      isBankVerified: false,
      beneficiaryName: "",
    },
  });

  const inputClassName =
    "w-full max-w-[438.8px] h-[49.6px] rounded-[34px] px-4 py-3 border-[0.8px] border-[#E2E8F0] border-t-[0.8px] bg-white opacity-100";

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      streetAddress: "",
      area: "",
      city: "",
      state: "",
      pinCode: "",
      bankDetails: {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        isBankVerified: false,
        beneficiaryName: "",
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsSaving(true);
    try {
      const { response, data } = await apiJson<{ message?: string }>(
          "/parties/add-party",
        {
          method: "POST",
          headers: jsonHeaders,
            body: JSON.stringify(form),
        },
      );

      if (!response.ok) {
        toast.error(data?.message || "Failed to create party");
        return;
      }

      toast.success(data?.message || "Party added successfully");
      navigate("/clients/parties");
    } catch (error) {
      console.error("Create party error:", error);
      toast.error("Failed to create party");
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold">Add Party</h1>
            <p className="text-[#62748E] text-base font-normal">
              Add a new party to your records
            </p>
          </div>
        </div>
      </div>

      {/* Form container */}

      <Card className="w-full rounded-3xl border border-[#E2E8F0] p-6 shadow-none">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-[#101928]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-bold text-white">
                1
              </span>
              <h2>Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <label className="text-sm font-normal text-[#314158]">First Name</label>
                <Input
                  placeholder="Enter first name"
                  className={inputClassName}
                  value={form.firstName}
                  onChange={(event) =>
                    handleChange("firstName", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-normal text-[#314158]">Last Name</label>
                <Input
                  placeholder="Enter last name"
                  className={inputClassName}
                  value={form.lastName}
                  onChange={(event) => handleChange("lastName", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-normal text-[#314158]">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  className={inputClassName}
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-normal text-[#314158]">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  className={inputClassName}
                  value={form.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-[#101928]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-bold text-white">
                3
              </span>
              <h2>Bank Details</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">Account Number</label>
                <Input
                  placeholder="Enter account number"
                  className={inputClassName}
                  value={form.bankDetails.accountNumber}
                  onChange={(e) => setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, accountNumber: e.target.value } }))}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">IFSC Code</label>
                <Input
                  placeholder="Enter IFSC code"
                  className={inputClassName}
                  value={form.bankDetails.ifscCode}
                  onChange={(e) => setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, ifscCode: e.target.value } }))}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">Bank Name</label>
                <Input
                  placeholder="Select or type bank name"
                  className={inputClassName}
                  list="bank-options"
                  value={form.bankDetails.bankName}
                  onChange={(e) => setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, bankName: e.target.value } }))}
                />
                <datalist id="bank-options">
                  {BANK_NAMES.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">Beneficiary Name</label>
                <Input
                  placeholder="Beneficiary name"
                  className={inputClassName}
                  value={beneficiaryName || form.bankDetails.beneficiaryName}
                  readOnly
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  disabled={isVerifyingBank || form.bankDetails.isBankVerified}
                  onClick={async () => {
                    const ifscCode = form.bankDetails.ifscCode?.trim();
                    const accountNumber = form.bankDetails.accountNumber?.trim();

                    if (!ifscCode) {
                      toast.error("Please enter IFSC code");
                      return;
                    }
                    if (!accountNumber) {
                      toast.error("Please enter account number");
                      return;
                    }

                    setIsVerifyingBank(true);
                    try {
                      const { data } = await apiJson<any>(`/team/add-employee/verify-bank`, {
                        method: "POST",
                        body: JSON.stringify({ ifsc: ifscCode, id_number: accountNumber }),
                        headers: { "Content-Type": "application/json" },
                      });

                      if (data?.status === "success" || data?.res_code === 200 || data?.data?.accountExists) {
                        const name = data?.data?.name_at_bank || data?.data?.full_name || data?.data?.fullName || "";
                        setBeneficiaryName(name);
                        setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, isBankVerified: true, beneficiaryName: name } }));
                        toast.success("Bank details verified successfully");
                      } else {
                        toast.error(data?.message || "Failed to verify bank details. Please check the details and try again.");
                      }
                    } catch (error) {
                      toast.error("Failed to verify bank details. Please try again.");
                    } finally {
                      setIsVerifyingBank(false);
                    }
                  }}
                  className="h-9 w-40 rounded-[10px] bg-[#00C950] px-4 text-sm font-semibold text-white hover:bg-[#29ca4c] disabled:cursor-not-allowed"
                >
                  {isVerifyingBank ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : form.bankDetails.isBankVerified ? (
                    "Verified"
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-[#101928]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-bold text-white">
                2
              </span>
              <h2>Address Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">Street Address</label>
                <Input
                  placeholder="Enter street address"
                  className={inputClassName}
                  value={form.streetAddress}
                  onChange={(event) =>
                    handleChange("streetAddress", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">Area</label>
                <Input
                  placeholder="Enter area"
                  className={inputClassName}
                  value={form.area}
                  onChange={(event) => handleChange("area", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">City</label>
                <Input
                  placeholder="Enter city"
                  className={inputClassName}
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">State</label>
                <Input
                  placeholder="Enter state"
                  className={inputClassName}
                  value={form.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4 md:col-span-2">
                <label className="text-sm font-medium text-[#344054]">PIN Code</label>
                <Input
                  placeholder="Enter PIN code"
                  className={inputClassName}
                  value={form.pinCode}
                  onChange={(event) => handleChange("pinCode", event.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-32 rounded-full border-[#D0D5DD] bg-[#F8FAFC] text-[#344054]"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 min-w-40 rounded-full bg-linear-to-r from-[#E60076] to-[#C6005C] text-white hover:opacity-95"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddParty;
