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

 export const BANK_NAMES = [
    "AIRTEL PAYMENTS BANK",
    "AU SMALL FINANCE BANK",
    "AXIS BANK",
    "BANDHAN BANK",
    "BANK OF BARODA",
    "BANK OF INDIA",
    "BANK OF MAHARASHTRA",
    "CANARA BANK",
    "CATHOLIC SYRIAN BANK",
    "CENTRAL BANK OF INDIA",
    "CITY UNION BANK",
    "CSB BANK",
    "DCB BANK",
    "DHANLAXMI BANK",
    "EQUITAS SMALL FINANCE BANK",
    "FEDERAL BANK",
    "HDFC BANK",
    "ICICI BANK",
    "IDBI BANK",
    "IDFC FIRST BANK",
    "INDIA POST PAYMENTS BANK",
    "INDIAN BANK",
    "INDIAN OVERSEAS BANK",
    "INDUSIND BANK",
    "JANA SMALL FINANCE BANK",
    "KARNATAKA BANK",
    "KARUR VYSYA BANK",
    "KOTAK MAHINDRA BANK",
    "LAKSHMI VILAS BANK",
    "MEHSANA URBAN CO-OPERATIVE BANK",
    "NKGSB CO-OPERATIVE BANK",
    "PAYTM PAYMENTS BANK",
    "PUNJAB & SIND BANK",
    "PUNJAB NATIONAL BANK",
    "RBL BANK",
    "SARASWAT CO-OPERATIVE BANK",
    "SHAMRAO VITHAL CO-OPERATIVE BANK",
    "SOUTH INDIAN BANK",
    "STATE BANK OF INDIA",
    "SURYODAY SMALL FINANCE BANK",
    "TAMILNAD MERCANTILE BANK",
    "THE GUJARAT STATE CO-OPERATIVE BANK",
    "THE HALOL MERCANTILE CO-OPERATIVE BANK",
    "THE HOWRAH DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE JALGAON DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE KARNATAKA STATE CO-OPERATIVE APEX BANK",
    "THE MADURAI DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE MAGADH CENTRAL CO-OPERATIVE BANK",
    "THE MAHENDRAGARH CENTRAL CO-OPERATIVE BANK",
    "THE MAHOBA URBAN CO-OPERATIVE BANK",
    "THE MATTANCHERRY SARVAJANIK CO-OPERATIVE BANK",
    "THE MEENACHIL EAST URBAN CO-OPERATIVE BANK",
    "THE MUMBAI DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE MUZAFFARPUR CENTRAL CO-OPERATIVE BANK",
    "THE NAGPUR DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE NANDED DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE NATIONAL CO-OPERATIVE BANK",
    "THE NAVAL DOCKYARD CO-OPERATIVE BANK",
    "THE NAWANSHAHR CENTRAL CO-OPERATIVE BANK",
    "THE NILAMBUR CO-OPERATIVE URBAN BANK",
    "THE NILGIRIS DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE RAJASTHAN STATE CO-OPERATIVE BANK",
    "THE TAMILNADU STATE APEX CO-OPERATIVE BANK",
    "THE THIRUVANNAMALAI DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE VIRUDHUNAGAR DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE VISAKHAPATNAM CO-OPERATIVE BANK",
    "THE WEST BENGAL STATE CO-OPERATIVE BANK",
    "UCO BANK",
    "UJJIVAN SMALL FINANCE BANK",
    "UNION BANK OF INDIA",
    "VASAI JANATA SAHAKARI BANK",
    "YES BANK",
  ];