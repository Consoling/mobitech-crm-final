import { mobileBrands } from "@/constants/const";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import { apiFetch } from "@/lib/api";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface BrandCount {
  brand: string;
  count: number;
}

const CACHE_KEY = "brand_counts_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const ModelSelection = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrandCounts = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cached data if it's less than 10 minutes old
          if (now - timestamp < CACHE_DURATION) {
            setBrandCounts(data);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data from API
        const response = await apiFetch("/models/get-counts");
        if (!response.ok) {
          console.error("Failed to fetch brand counts");
          setLoading(false);
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          // Transform array to object for quick lookup
          const countsMap: Record<string, number> = {};
          result.data.forEach((item: BrandCount) => {
            countsMap[item.brand.toLowerCase()] = item.count;
          });

          setBrandCounts(countsMap);

          // Cache the data with current timestamp
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: countsMap,
              timestamp: Date.now(),
            })
          );
        }
      } catch (error) {
        console.error("Error fetching brand counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandCounts();
  }, []);

  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center gap-4 mb-6">
        {/* Wallet Icon with gradient background */}
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#9810FA] to-[#8200DB] flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>

        {/* Title and subtitle */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">All brands</h1>
          <p className="text-[#62748E] text-base font-normal">
            Browse and manage all device models
          </p>
        </div>

       
      </div>

      {/* Search bar and filter */}
      <SearchFilterBar
        wrapperClassName="flex items-center gap-3 mb-16"
        inputClassName="h-11 pl-10 text-sm"
        filterButtonClassName="h-11"
        placeholder="Search models by Brand, Model or Model code..."
        value={searchText}
        onValueChange={setSearchText}
        enableAutocomplete={true}
        onAutocompleteSelect={(result) => {
          if (result.type === 'brand') {
            navigate(`/model/${result.id}`);
          } else if (result.type === 'model' || result.type === 'modelCode') {
            navigate(`/model/${result.data.brand}/${result.data.smc}`);
          }
        }}
      />

      <BrandSelection brandCounts={brandCounts} loading={loading} />
      {/* Models Grid */}
    </div>
  );
};

export default ModelSelection;

interface BrandSelectionProps {
  brandCounts: Record<string, number>;
  loading: boolean;
}

const BrandSelection = ({ brandCounts, loading }: BrandSelectionProps) => {
const route = useNavigate();
  const handleBrandSelect = (brandId: string) => {
    route(`/model/${brandId}`);
  }
  return (
    <div className="container mx-auto ">
      <div className="relative overflow-hidden">
        {/* Brands Grid */}
        <div className={`transition-transform duration-300 ease-in-out`}>
          <div className="grid grid-cols-2 p-5 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-10 gap-6">
            {mobileBrands.map((brand) => {
              return (
                <div
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand.id)}
                  className=" rounded-lg sm:h-50  sm:w-50 h-40 w-40  bg-white cursor-pointer transition-all hover:shadow-md flex flex-col justify-between items-center py-4 hover:border-blue-500 hover:ring-1 hover:ring-blue-200 border-gray-400/40 sm:border-gray-400/70 relative"
                >
                  <div className="relative h-16 sm:h-20 w-16 sm:w-20 mb-2 flex flex-col justify-center items-center mt-4 ">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="object-contain"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    <span className="font-normal text-sm text-[#000000]">
                      {brand.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 font-medium text-center">
                    {loading ? (
                      "Loading..."
                    ) : brandCounts[brand.id] ? (
                      `${brandCounts[brand.id]} Model${brandCounts[brand.id] === 1 ? "" : "s"}`
                    ) : (
                      "0 Models"
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
