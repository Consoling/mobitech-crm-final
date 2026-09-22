import { apiJson } from "@/lib/api";
import type {
  Lead,
  LeadType,
  LeadsResponse,
} from "@/types/leads";

interface GetLeadsParams {
  type: LeadType;
  page: number;
  limit: number;
  sort: "asc" | "desc";
}

export const getLeads = async ({
  type,
  page,
  limit,
  sort,
}: GetLeadsParams): Promise<LeadsResponse> => {
  const params = new URLSearchParams({
    type,
    page: String(page),
    limit: String(limit),
    sort,
  });

  const { response, data } = await apiJson<LeadsResponse>(
    `/leads/lead-data?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      (data as any)?.message || "Failed to fetch leads"
    );
  }

  return data;
};

export const getLeadById = async (
  id: string
): Promise<Lead> => {
  const { response, data } = await apiJson<{
    result: "success";
    data: Lead;
  }>(`/leads/lead-data/${id}`);

  if (!response.ok) {
    throw new Error(
      (data as any)?.message || "Failed to fetch lead"
    );
  }

  return data.data;
};