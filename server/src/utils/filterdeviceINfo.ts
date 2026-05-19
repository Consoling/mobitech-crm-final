import { KNOWN_BRANDS } from "./constants";

export const normalizeDeviceInfo = (deviceInfo: any) => {
  if (!deviceInfo) {
    return {
      brand: null,
      model: null,
      ram: null,
      storage: null,
    };
  }

  let brand = String(deviceInfo.brand ?? "").trim();
  let model = String(deviceInfo.model ?? "").trim();

  if (!brand && model) {
    const words = model.split(/\s+/);
    const firstWord = words[0]?.toLowerCase();

    if (KNOWN_BRANDS.has(firstWord)) {
      brand = words[0];
      model = words.slice(1).join(" ");
    }
  }

  return {
    brand,
    model,
    ram: deviceInfo.ram ?? null,
    storage: deviceInfo.storage ?? null,
  };
};