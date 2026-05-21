'use client'
import { SYS_VAR } from "@/constants/const";
import { useEffect, useState } from "react";

export function useModelData(modelId: string | null) {
  const [mobileDataLoading, setMobileDataLoading] = useState(false);
  const [mobileData, setMobileData] = useState<any>(null);
  const [mobileDataError, setMobileDataError] = useState<any>(null);
  useEffect(() => {
    if (!modelId) return;
    setMobileDataLoading(true);
    setMobileDataError(null);
    fetch(`${SYS_VAR.BACKEND_URL_V2}/pickup/get-individual-model-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: modelId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch model data");
        return res.json();
      })
      .then((json) => {
        if (!json?.data) throw new Error("No device found for the specified model");
        setMobileData({
          model: json.data.model,
          brand: json.data.brand,
          detailedSpec: json.data.detailedSpec,
          imageUrl: json.data.imageUrl,
        });
      })
      .catch(setMobileDataError)
      .finally(() => setMobileDataLoading(false));
  }, [modelId]);

  return { mobileDataLoading, mobileData, mobileDataError };
}