import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LucideUserCircle2,
} from "lucide-react";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getLeads } from "@/api/leads.api";
import type { LeadType } from "@/types/leads";
import { Link } from "react-router-dom";

const ViewLeads = () => {
  const [type, setType] = useState<LeadType>("phone");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const limit = 10;

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "leads",
      type,
      page,
      sort,
    ],

    queryFn: () =>
      getLeads({
        type,
        page,
        limit,
        sort,
      }),

    placeholderData: (previousData) => previousData,

    staleTime: 30_000,
  });

  const leads = data?.data.leads ?? [];
  const pagination = data?.data.pagination;

  const changeType = (newType: LeadType) => {
    setType(newType);
    setPage(1);
  };

  const toggleSort = () => {
    setSort((current) =>
      current === "desc" ? "asc" : "desc"
    );
    setPage(1);
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[#E60076] to-[#C6005C]">
            <LucideUserCircle2 className="h-6 w-6 text-white" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">
              View Leads
            </h1>

            <p className="text-base font-normal text-[#62748E]">
              View all leads in the system
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
          {[
            ["phone", "Phones"],
            ["tablet", "Tablets"],
            ["other", "Others"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                changeType(value as LeadType)
              }
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                type === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <button
          type="button"
          onClick={toggleSort}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {sort === "desc" ? (
            <>
              <ArrowDown className="h-4 w-4" />
              Newest first
            </>
          ) : (
            <>
              <ArrowUp className="h-4 w-4" />
              Oldest first
            </>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Mobile
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Device
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Variant
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Verification
                </th>

                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Submitted
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-64 text-center"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#E60076]" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-64 text-center text-sm text-slate-500"
                  >
                    No leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead: any) => (
                  <tr
                    key={lead.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {lead.name}
                      </div>

                      {lead.customer && (
                        <div className="mt-0.5 text-xs text-slate-400">
                          Registered customer
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {lead.mobileNumber}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {lead.device?.name || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {lead.device?.variant || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          lead.userVerified
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {lead.userVerified
                          ? "Verified"
                          : "Unverified"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(
                        lead.createdAt
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                      to={`/clients/leads/${lead.id}`}
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-[#E60076]/30 hover:bg-[#E60076]/5 hover:text-[#E60076]"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {pagination.total}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPage((p) => p - 1)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-sm font-semibold text-slate-700">
                {pagination.page} /{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  pagination.page ===
                  pagination.totalPages
                }
                onClick={() =>
                  setPage((p) => p + 1)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isFetching && !isLoading && (
        <div className="mt-2 text-right text-xs text-slate-400">
          Updating...
        </div>
      )}
    </div>
  );
};

export default ViewLeads;