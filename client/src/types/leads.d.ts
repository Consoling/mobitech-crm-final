export type LeadType = "phone" | "tablet" | "other";

export interface LeadDevice {
  smc?: string;
  name?: string;
  image?: string;
  variant?: string;
}

export interface LeadCustomer {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  address?: unknown;
  isVerified?: boolean;
}

export interface LeadForm {
  calls?: string;
  touch?: string;
  "original-screen"?: string;
  "manufacturer-warranty"?: string;
  "gst-valid-bill-with-same-imei"?: string;
  condition?: string;

  issues?: string[];
  accessories?: string[];

  name?: string;
  phone?: string;
  address?: string;

  [key: string]: unknown;
}

export interface Lead {
  id: string;
  sessionId: string;
  name: string;
  mobileNumber: string;
  address: string;
  userVerified: boolean;

  device: LeadDevice;
  form: LeadForm;

  createdAt: string;
  updatedAt: string;

  customer: LeadCustomer | null;
}

export interface LeadsResponse {
  result: "success";
  data: {
    leads: Lead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}