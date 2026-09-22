import {
  ArrowLeft,
  Check,
  ClipboardList,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Phone,
  Smartphone,
  User,
  X,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getLeadById } from "@/api/leads.api";

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLabel = (value: string) => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSessionType = (sessionId: string) => {
  if (sessionId.startsWith("SOMB")) return "Phone";
  if (sessionId.startsWith("SOTB")) return "Tablet";
  if (sessionId.startsWith("SOOA")) return "Other";

  return "Unknown";
};

const StatusBadge = ({
  verified,
}: {
  verified: boolean;
}) => {
  return verified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600">
      <Check className="h-3.5 w-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600">
      <X className="h-3.5 w-3.5" />
      Unverified
    </span>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
};

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: lead,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => getLeadById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#E60076]" />
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="px-6 py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <p className="font-semibold text-slate-900">
              Unable to load lead
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {(error as Error)?.message ||
                "The requested lead could not be found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const form = lead.form ?? {};
  const device = lead.device ?? {};

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>

        <div className="flex items-start justify-between gap-5 max-md:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[#E60076] to-[#C6005C]">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Lead Details
                </h1>

                <p className="mt-0.5 text-sm text-slate-500">
                  {lead.sessionId}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge verified={lead.userVerified} />

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {getSessionType(lead.sessionId)}
            </span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Customer */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-50 text-[#E60076]">
                <User className="h-4 w-4" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Customer Information
                </h2>

                <p className="text-xs text-slate-400">
                  Lead contact details
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <InfoItem
                label="Name"
                value={lead.name}
              />

              <InfoItem
                label="Mobile Number"
                value={lead.mobileNumber}
              />

              <InfoItem
                label="Customer Account"
                value={
                  lead.customer
                    ? `${lead.customer.firstName}${
                        lead.customer.lastName
                          ? ` ${lead.customer.lastName}`
                          : ""
                      }`
                    : "Not registered"
                }
              />

              <InfoItem
                label="Email"
                value={lead.customer?.email}
              />

              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-400">
                  Address
                </p>

                <div className="mt-2 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <p className="text-sm font-semibold text-slate-800">
                    {lead.address || "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Device */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Smartphone className="h-4 w-4" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Device
                </h2>

                <p className="text-xs text-slate-400">
                  Device submitted for evaluation
                </p>
              </div>
            </div>

            <div className="flex gap-5 p-6 max-sm:flex-col">
              {device.image ? (
                <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-4">
                  <img
                    src={device.image}
                    alt={device.name || "Device"}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                  <Smartphone className="h-10 w-10 text-slate-300" />
                </div>
              )}

              <div className="grid flex-1 content-center gap-5 sm:grid-cols-2">
                <InfoItem
                  label="Device"
                  value={device.name}
                />

                <InfoItem
                  label="Variant"
                  value={device.variant}
                />

                {/* <InfoItem
                  label="SMC"
                  value={device.smc}
                /> */}

                <InfoItem
                  label="Category"
                  value={getSessionType(lead.sessionId)}
                />
              </div>
            </div>
          </section>

          {/* Device Assessment */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ClipboardList className="h-4 w-4" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Device Assessment
                </h2>

                <p className="text-xs text-slate-400">
                  Information submitted by the customer
                </p>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
              {Object.entries(form)
                .filter(
                  ([key]) =>
                    ![
                      "issues",
                      "accessories",
                      "name",
                      "phone",
                      "address",
                    ].includes(key)
                )
                .map(([key, value]) => (
                  <InfoItem
                    key={key}
                    label={formatLabel(key)}
                    value={
                      typeof value === "string"
                        ? formatLabel(value)
                        : Array.isArray(value)
                          ? value.join(", ")
                          : String(value ?? "—")
                    }
                  />
                ))}
            </div>
          </section>

          {/* Issues */}
          {Array.isArray(form.issues) &&
            form.issues.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <X className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Reported Issues
                    </h2>

                    <p className="text-xs text-slate-400">
                      Issues selected during the assessment
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-6">
                  {form.issues.map((issue: any) => (
                    <span
                      key={issue}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
                    >
                      {formatLabel(issue)}
                    </span>
                  ))}
                </div>
              </section>
            )}

          {/* Accessories */}
          {Array.isArray(form.accessories) &&
            form.accessories.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Package className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Accessories
                    </h2>

                    <p className="text-xs text-slate-400">
                      Accessories included with the device
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-6">
                  {form.accessories.map((accessory: any) => (
                    <span
                      key={accessory}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-600"
                    >
                      <Check className="h-4 w-4" />
                      {formatLabel(accessory)}
                    </span>
                  ))}
                </div>
              </section>
            )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Lead summary */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Lead Summary
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <InfoItem
                label="Lead ID"
                value={lead.id}
              />

              <InfoItem
                label="Session ID"
                value={lead.sessionId}
              />

              <InfoItem
                label="Category"
                value={getSessionType(lead.sessionId)}
              />

              <InfoItem
                label="Submitted"
                value={formatDate(lead.createdAt)}
              />

              <InfoItem
                label="Last Updated"
                value={formatDate(lead.updatedAt)}
              />

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Mobile Verification
                </p>

                <div className="mt-2">
                  <StatusBadge
                    verified={lead.userVerified}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Customer */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Customer Account
              </h2>
            </div>

            <div className="p-6">
              {lead.customer ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-50 text-sm font-bold text-[#E60076]">
                      {lead.customer.firstName
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {lead.customer.firstName}{" "}
                        {lead.customer.lastName}
                      </p>

                      <p className="text-xs text-slate-500">
                        {lead.customer.phone}
                      </p>
                    </div>
                  </div>

                  <Link
                  to={`/clients/view-customer/${lead.customer.id}`}
                    type="button"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Customer
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <User className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Guest Lead
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    This lead is not associated with a registered
                    customer account.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Contact
              </h2>
            </div>

            <div className="space-y-3 p-6">
              <a
                href={`tel:${lead.mobileNumber}`}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Phone className="h-4 w-4 text-[#E60076]" />
                {lead.mobileNumber}
              </a>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E60076]" />

                <span className="text-sm font-medium leading-5 text-slate-700">
                  {lead.address || "No address provided"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;