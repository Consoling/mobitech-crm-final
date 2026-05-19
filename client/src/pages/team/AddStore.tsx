import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import { useState } from "react";
import { apiJson, jsonHeaders } from "@/lib/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddStore = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    streetAddress: "",
    city: "",
    pinCode: "",
    state: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (!form.ownerName.trim()) {
      toast.error("Owner name is required");
      return;
    }
    if (!form.ownerPhone.trim()) {
      toast.error("Owner phone number is required");
      return;
    }
    if (!form.password.trim()) {
      toast.error("Password is required");
      return;
    } else if (form.password.trim().length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (
      form.ownerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())
    ) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (
      !form.streetAddress.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pinCode.trim()
    ) {
      toast.error("Complete store address is required");
      return;
    }
    setIsSaving(true);
    try {

      console.log("Submitting form with data:", form);
      const payload = {
        storeName: form.storeName,
        streetAddress: form.streetAddress,
        city: form.city,
        pinCode: form.pinCode,
        state: form.state,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        password: form.password,
      };

      const { response, data } = await apiJson<{ success?: boolean; message?: string; store?: any }>(
        "/team/add-store",
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errMsg = (data && (data as any).message) || "Failed to add store";
        toast.error(errMsg);
        return;
      }

      toast.success("Store added successfully");
      // navigate back to store list
      navigate("/manage-team/employees");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        "An error occurred while submitting the form. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
        {/* User Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7] flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Add New Stores</h1>
            <p className="text-[#62748E] text-base font-normal">
              Complete the form to register a new store
            </p>
          </div>
        </div>
      </div>
      {/* Form */}

      <Card className="bg-[#FFFFFF] px-6 py-8 border border-[#E4E7EC] rounded-[10px] flex flex-col gap-8">
        <div className="flex flex-col justify-center items-center gap-2">
          <h2 className="text-[#1A1A21] font-semibold text-2xl">
            Store Details
          </h2>
          <p className="text-sm font-normal text-[#8C94A6]">
            Fill out these details to add store details
          </p>
        </div>

        <div className="flex flex-col">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-[8px]">
              <label className="text-sm font-normal text-[#314158]">
                Store Name
              </label>
              <Input
                placeholder="Enter store name"
                value={form.storeName}
                readOnly={isSaving}
                onChange={(e) =>
                  setForm({ ...form, storeName: e.target.value })
                }
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-[#1A1A21] text-xl font-semibold ">
                Store Address
              </h2>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className="text-sm font-normal text-[#314158]">
                Street Address
              </label>
              <Input
                placeholder="Enter street address"
                value={form.streetAddress}
                readOnly={isSaving}
                onChange={(e) =>
                  setForm({ ...form, streetAddress: e.target.value })
                }
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
            </div>
            <div className="flex w-full gap-4 max-[550px]:flex-col grow">
              <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                <label className="text-sm font-normal text-[#314158]">
                  City
                </label>
                <Input
                  placeholder="Enter city"
                  value={form.city}
                  readOnly={isSaving}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
                />
              </div>
              <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                <label className="text-sm font-normal text-[#314158]">
                  PIN Code
                </label>
                <Input
                  placeholder="Enter PIN code"
                  value={form.pinCode}
                  readOnly={isSaving}
                  onChange={(e) =>
                    setForm({ ...form, pinCode: e.target.value })
                  }
                  className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
                />
              </div>
            </div>
            <div className="flex flex-col gap-[8px]">
              <label className="text-sm font-normal text-[#314158]">
                State
              </label>
              <Input
                placeholder="Enter state"
                value={form.state}
                readOnly={isSaving}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-[#1A1A21] text-xl font-semibold ">
                Owner Details
              </h2>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className="text-sm font-normal text-[#314158]">
                Owner Name
              </label>
              <Input
                placeholder="Enter owner name"
                value={form.ownerName}
                readOnly={isSaving}
                onChange={(e) =>
                  setForm({ ...form, ownerName: e.target.value })
                }
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
            </div>
            <div className="flex flex-col gap-[8px]">
              <label className="text-sm font-normal text-[#314158]">
                Owner Email
              </label>
              <Input
                placeholder="Enter owner email"
                value={form.ownerEmail}
                readOnly={isSaving}
                onChange={(e) =>
                  setForm({ ...form, ownerEmail: e.target.value })
                }
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
            </div>
            <div className="flex flex-col gap-[8px]">
              <label className="text-sm font-normal text-[#314158]">
                Owner Phone Number
              </label>
              <Input
                placeholder="Enter 10 digit phone number"
                value={form.ownerPhone}
                readOnly={isSaving}
                type="text"
                maxLength={10}
                onChange={(e) =>{

                  if (/^\d*$/.test(e.target.value)) {
                    setForm({ ...form, ownerPhone: e.target.value });
                  }}
                }
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
            </div>
            <div className="flex flex-col gap-[8px] mb-[32px] relative">
              <label className="text-sm font-normal text-[#314158]">
                Password
              </label>
              <Input
                placeholder="Enter password"
                value={form.password}
                readOnly={isSaving}
                type={isVisible ? "text" : "password"}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-[6px] border border-[#D0D5DD] p-4 h-[56px] "
              />
              <Button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute bg-transparent hover:bg-transparent right-3 top-[65%] -translate-y-[50%] p-0 h-auto w-auto hover:text-[#296CFF] text-[#314158]"
                variant="ghost"
              >
                {isVisible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <div>
              <Button
                disabled={isSaving}
                type="submit"
                className="w-full bg-[#296CFF] py-4 px-6 h-[55px] rounded-[8px] hover:bg-[#]"
              >
                {isSaving ? <Loader2 /> : "Add Store"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AddStore;
