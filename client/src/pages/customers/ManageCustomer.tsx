import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiJson, jsonHeaders } from "@/lib/api";
import { Loader2, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

type CustomerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
};

const emptyForm: CustomerForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  streetAddress: "",
  area: "",
  city: "",
  state: "",
  pinCode: "",
};

const ManageCustomer = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [initialForm, setInitialForm] = useState<CustomerForm>(emptyForm);

  const inputClassName =
    "w-full max-w-[438.8px] h-[49.6px] rounded-[34px] px-4 py-3 border-[0.8px] border-[#E2E8F0] border-t-[0.8px] bg-white opacity-100";

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
        const { response, data } = await apiJson<{ customer?: CustomerForm }>(
          `/customers/${encodeURIComponent(customerId)}`,
        );

        if (!response.ok || !data?.customer) {
          toast.error("Failed to load customer details");
          return;
        }

        if (!active) return;

        const nextForm: CustomerForm = {
          firstName: data.customer.firstName ?? "",
          lastName: data.customer.lastName ?? "",
          email: data.customer.email ?? "",
          phone: data.customer.phone ?? "",
          streetAddress: data.customer.streetAddress ?? "",
          area: data.customer.area ?? "",
          city: data.customer.city ?? "",
          state: data.customer.state ?? "",
          pinCode: data.customer.pinCode ?? "",
        };

        setForm(nextForm);
        setInitialForm(nextForm);
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

  const handleChange = (key: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerId) {
      toast.error("Customer ID is missing");
      return;
    }

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
        `/customers/${encodeURIComponent(customerId)}`,
        {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify(form),
        },
      );

      if (!response.ok) {
        toast.error(data?.message || "Failed to update customer");
        return;
      }

      toast.success(data?.message || "Customer updated successfully");
      setInitialForm(form);
      navigate("/clients/customers");
    } catch (error) {
      console.error("update customer error", error);
      toast.error("Failed to update customer");
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#E60076] to-[#C6005C]">
            <UserCircle className="h-6 w-6 text-white" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Edit Customer</h1>
            <p className="text-base font-normal text-[#62748E]">
              Update customer details
            </p>
          </div>
        </div>
      </div>

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
                <label className="text-sm font-normal text-[#314158]">
                  First Name
                </label>
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
                <label className="text-sm font-normal text-[#314158]">
                  Last Name
                </label>
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
                <label className="text-sm font-normal text-[#314158]">
                  Phone Number
                </label>
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
                2
              </span>
              <h2>Address Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[#344054]">
                  Street Address
                </label>
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

export default ManageCustomer;