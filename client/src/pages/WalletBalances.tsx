import { Card } from "@/components/ui/card";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WalletBalances = () => {
  const route = useNavigate();
  const [lastUpdated, setLastUpdated] = useState<{ [key: number]: string }>({
    1: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    2: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    3: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    4: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    5: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  });

  const [refreshing, setRefreshing] = useState<{ [key: number]: boolean }>({});

  const handleRefresh = async (id: number) => {
    setRefreshing((prev) => ({ ...prev, [id]: true }));

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLastUpdated((prev) => ({
      ...prev,
      [id]: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    }));

    setRefreshing((prev) => ({ ...prev, [id]: false }));
  };

  const cards = [
    {
      id: 1,
      title: "FAST2SMS",
      balance: "₹5000",
      blEndpoint: "/api/fast2sms/balance",
      refetchBalance: () => {},
    },
    {
      id: 2,
      title: "PayU",
      balance: "₹5500",
      blEndpoint: "/api/payu/balance",
      refetchBalance: () => {},
    },
    {
      id: 3,
      title: "AWS",
      balance: "₹5080",
      blEndpoint: "/api/aws/balance",
      refetchBalance: () => {},
    },
    {
      id: 4,
      title: "EKYC",
      balance: "₹4500",
      blEndpoint: "/api/ekyc/balance",
      refetchBalance: () => {},
    },
    {
      id: 5,
      title: "IMEI Validator",
      balance: "₹3654.98",
      blEndpoint: "/api/imei-validator/balance",
      refetchBalance: () => {},
    },
  ];
  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold mb-1">My Wallets</h1>
      <p className="text-gray-600 mb-6">Manage your wallet balances</p>

      <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 min-[1800px]:grid-cols-3 gap-6">
        {cards.map((card: any) => {
          return (
            <Card
              key={card.id}
              className="w-full max-w-106 h-60 bg-white border border-gray-200 rounded-[24px] px-6 py-6 flex flex-col justify-between"
            >
              {/* Header with title and refresh button */}
              <div className="flex items-center justify-between ">
                <h2 className="text-lg font-bold">{card.title}</h2>
                <button
                  onClick={() => handleRefresh(card.id)}
                  disabled={refreshing[card.id]}
                  className="w-8 h-8 cursor-pointer rounded-full bg-[#ECECEC] flex items-center justify-center hover:bg-[#d9d9d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-700 ${
                      refreshing[card.id] ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Balance section */}
              <div className="-mb-2">
                <div className="text-3xl font-bold mb-1">{card.balance}</div>
                <div className="text-[#4B5563] font-normal text-[14px] leading-5 mb-1">
                  Available Balance
                </div>
                <div className="text-gray-500 font-normal text-[12px] leading-4">
                  Last Updated: {lastUpdated[card.id]}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-start items-start">
                <button className="h-10 px-10 py-2 cursor-pointer bg-blue-600 text-white rounded-[10px] hover:bg-blue-700 transition-colors text-xs">
                  Add Funds
                </button>
                <button
                  onClick={() =>
                    route(
                      `/wallet/view-balance?wallet=${card.title
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`
                    )
                  }
                  className="h-10 px-10 py-2 cursor-pointer border border-[#E5E7EB] rounded-[10px] hover:bg-white/70 text-xs"
                >
                  View Details
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WalletBalances;
