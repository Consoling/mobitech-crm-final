import appleImg from '../assets/apple.webp';
import samsungImg from '../assets/samsung.webp';
import xiaomiImg from '../assets/xiaomi.webp';
import vivoImg from '../assets/vivo.webp';
import oneplusImg from '../assets/one plus.webp';
import oppoImg from '../assets/oppo.webp';
import realmeImg from '../assets/realme.webp';
import motorolaImg from '../assets/motorola.webp';
import lenovoImg from '../assets/lenovo.webp';
import honorImg from '../assets/honor.webp';
import googleImg from '../assets/google.webp';
import pocoImg from '../assets/poco.webp';
import infinixImg from '../assets/infinix.webp';
import technoImg from '../assets/techno.webp';
import iqooImg from '../assets/iqoo.webp';
import nothingImg from '../assets/nothing.webp';

interface Brand {
  id: string;
  name: string;
  logo: string;
  apiEndpoint: string;
}
export const mobileBrands: Brand[] = [
  {
    id: "apple",
    name: "Apple",
    logo: appleImg,
    apiEndpoint: "apple-phones-48",
  },
  {
    id: "samsung",
    name: "Samsung",
    logo: samsungImg,
    apiEndpoint: "samsung-phones-9",
  },
  {
    id: "xiaomi",
    name: "Xiaomi",
    logo: xiaomiImg,
    apiEndpoint: "xiaomi-phones-80",
  },
  {
    id: "vivo",
    name: "Vivo",
    logo: vivoImg,
    apiEndpoint: "vivo-phones-98",
  },
  {
    id: "oneplus",
    name: "OnePlus",
    logo: oneplusImg,
    apiEndpoint: "oneplus-phones-95",
  },
  {
    id: "oppo",
    name: "Oppo",
    logo: oppoImg,
    apiEndpoint: "oppo-phones-82",
  },
  {
    id: "realme",
    name: "Realme",
    logo: realmeImg,
    apiEndpoint: "realme-phones-118",
  },
  {
    id: "motorola",
    name: "Motorola",
    logo: motorolaImg,
    apiEndpoint: "motorola-phones-4",
  },
  {
    id: "lenovo",
    name: "Lenovo",
    logo: lenovoImg,
    apiEndpoint: "lenovo-phones-73",
  },
  
  {
    id: "honor",
    name: "Honor",
    logo: honorImg,
    apiEndpoint: "honor-phones-121",
  },
  {
    id: "google",
    name: "Google",
    logo: googleImg,
    apiEndpoint: "google-phones-107",
  },
  {
    id: "poco",
    name: "Poco",
    logo: pocoImg,
    apiEndpoint: "poco-phones-generic",
  },
  {
    id: "infinix",
    name: "Infinix",
    logo: infinixImg,
    apiEndpoint: "infinix-phones-119",
  },
  {
    id: "techno",
    name: "Tecno",
    logo: technoImg,
    apiEndpoint: "tecno-phones-120",
  },
  {
    id: "iqoo",
    name: "iQOO",
    logo: iqooImg,
    apiEndpoint: "vivo-phones-98",
  },
  {
    id: "nothing",
    name: "Nothing",
    logo: nothingImg,
    apiEndpoint: "nothing-phones-128",
  },
];

export const COMMON_VARIANTS = [
  "2 GB/16 GB",
  "2 GB/32 GB",
  "2 GB/64 GB",
  "3 GB/16 GB",
  "3 GB/32 GB",
  "3 GB/64 GB",
  "3 GB/128 GB",
  "4 GB/32 GB",
  "4 GB/64 GB",
  "4 GB/128 GB",
  "4 GB/256 GB",
  "6 GB/64 GB",
  "6 GB/128 GB",
  "6 GB/256 GB",
  "8 GB/128 GB",
  "8 GB/256 GB",
  "8 GB/512 GB",
  "12 GB/128 GB",
  "12 GB/256 GB",
  "12 GB/512 GB",
  "12 GB/1 TB",
  "16 GB/256 GB",
  "16 GB/512 GB",
  "16 GB/1 TB",
  "24 GB/1 TB",
];

const normalizeBaseUrl = (raw: unknown, fallback: string) => {
  const value = String(raw ?? "").trim();
  const cleaned = value
    .replace(/^=+/, "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();

  if (!cleaned) return fallback;
  return cleaned.replace(/\/+$/, "");
};

export const SYS_VAR = {
  BACKEND_URL: normalizeBaseUrl(
    import.meta.env.VITE_BACKEND_URL,
    "http://localhost:4000",
  ),
};