import { useSearchParams, useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const WalletBalance = () => {
  const params = useSearchParams();
  const [searchParams] = params;
  const wallet = searchParams.get("wallet");
  const navigate = useNavigate();
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
  // If no wallet param, show error
  if (!wallet) {
    return (
      <div className="px-6 py-6 flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Uh ohh! Malformed URL
        </h1>
        <p className="text-gray-600 mb-6">
          The wallet parameter is missing from the URL.
        </p>
        <Button
          onClick={() => navigate("/wallet/wallet-balances")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center gap-4 mb-6">
        {/* Wallet Icon with gradient background */}
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#009966] to-[#007A55] flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>

        {/* Title and subtitle */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-[#62748E7] text-base font-normal">
            Manage your financial transactions
          </p>
        </div>
      </div>

      {/* Balance Card with Gradient */}
      <div className="w-full bg-linear-to-br from-[#009966] to-[#007A55] rounded-[16px] h-[220px] px-8 py-8  mb-6">
        <div className="flex gap-5 flex-col items-start justify-between">
          <div>
            <p className="text-[#D0FAE5] text-base font-normal mb-2">Current Balance</p>
            <h2 className="text-white text-5xl font-bold">
              {cards.find((c) => c.title === wallet)?.balance || "₹0.00"}
            </h2>
          </div>
          <button className="bg-white cursor-pointer px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-shadow">
            <Plus className="w-5 h-5 text-[#009966]" />
            <span className="bg-linear-to-br from-[#009966] to-[#007A55] bg-clip-text text-transparent">
              Add Money
            </span>
          </button>
        </div>
      </div>

      {/* <p className="text-gray-600">
        Detailed view of a specific wallet balance will be shown here.
      </p> */}
    </div>
  );
};

export default WalletBalance;
