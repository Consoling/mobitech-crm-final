import { apiJson, jsonHeaders } from "@/lib/api";

type DeviceVariant = {
  _id: string;
  variant: string;
  isActive: boolean;
};

type ApiResponse<T> = {
  status: "success" | "error";
  data: T;
  message?: string;
};

export const getDeviceVariants = async () => {
  const { response, data } = await apiJson<ApiResponse<DeviceVariant[]>>(
    "/util/get-device-variants"
  );

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to fetch device variants");
  }

  return data.data;
};

export const addDeviceVariant = async (payload: {
  variant: string;
  isActive?: boolean;
}) => {
  const { response, data } = await apiJson<ApiResponse<DeviceVariant>>(
    "/util/add-device-variant",
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to add device variant");
  }

  return data.data;
};