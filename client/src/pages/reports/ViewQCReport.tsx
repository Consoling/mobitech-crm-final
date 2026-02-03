import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BadgeCheck,
  Clipboard,
  Download,
  Smartphone,
  User,
  Loader2,
  XCircle,
  CircleCheck,
  CircleX,
  FingerprintPattern,
  Vibrate,
  Usb,
  Camera,
  LocateFixed,
  Wifi,
  Bluetooth,
  Shield,
  CardSim,
  Headset,
  Volume2,
  Volume,
  Mic,
  Ear,
  CirclePower,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiJson, jsonHeaders } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const testResArray = [
  {
    testName: "Screen Discoloration",
    icon: <Smartphone />,
    key: "screenDiscolorationTest",
  },
  {
    testName: "Screen Calibration",
    icon: <Smartphone />,
    key: "screenCalibrationTest",
  },
  { testName: "Multi Touch", icon: <Smartphone />, key: "multiTouchTest" },
  { testName: "GPS", icon: <LocateFixed />, key: "gpsTest" },
  { testName: "WiFi", icon: <Wifi />, key: "wifiTest" },
  { testName: "Bluetooth", icon: <Bluetooth />, key: "bluetoothTest" },
  { testName: "Front Camera", icon: <Camera />, key: "frontCameraTest" },
  { testName: "Back Camera", icon: <Camera />, key: "backCameraTest" },
  { testName: "Power Button", icon: <CirclePower />, key: "powerButtonTest" },
  { testName: "Volume Keys", icon: <Volume2 />, key: "volumeKeysTest" },
  {
    testName: "Proximity Sensor",
    icon: <Smartphone />,
    key: "proximitySensorTest",
  },
  { testName: "Earpiece", icon: <Ear />, key: "earpieceTest" },
  { testName: "Speaker", icon: <Volume />, key: "speakerTest" },
  { testName: "Microphone", icon: <Mic />, key: "microphoneTest" },
  { testName: "Fingerprint", icon: <FingerprintPattern />, key: "fingerprintTest" },
  { testName: "Vibration", icon: <Vibrate />, key: "vibrationTest" },
  { testName: "Charging Port", icon: <Usb />, key: "chargingPortTest" },
  { testName: "Audio Jack", icon: <Headset />, key: "audioJackTest" },
  { testName: "SIM Card", icon: <CardSim />, key: "simCardTest" },
  { testName: "Finance Lock", icon: <Shield />, key: "financeLockTest" },
];

interface ReportData {
  upperLayerData: {
    employeeImage: string | null;
    employeeId: string;
    employeeName: string;
    createdAt: string;
    brand: string | null;
    model: string | null;
    ram: string | null;
    storage: string | null;
    imeiVerifiedModel: string | null;
    imei1: string;
    imei2: string | null;
    testId: string;
  };
  lowerLayerData: {
    [key: string]: string | null;
  };
}

const ViewQCReport = () => {
  const { user } = useAuthStore();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError("No report ID provided");
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await apiJson<{
          success: boolean;
          data: ReportData;
          testCount: number;
        }>(`/reports/get-qc-report/${reportId}`, {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({ userId: user.id }),
        });

        if (data.success) {
          setReport(data.data);
          setError(null);
        } else {
          setError("Failed to fetch report");
        }
      } catch (err) {
        console.error("Error fetching QC report:", err);
        setError("QC Report not found");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#009966]" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <p className="text-xl text-gray-600">{error || "No report found"}</p>
      </div>
    );
  }

  const getTestStatus = (
    testKey: string,
  ): "Passed" | "Failed" | "Skipped" | null => {
    const value = report.lowerLayerData[testKey];
    if (value === "Passed") return "Passed";
    if (value === "Failed") return "Failed";
    if (value === "Skipped") return "Skipped";
    return null;
  };

  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
        {/* Wallet Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#009966] to-[#007A55] flex items-center justify-center">
            <Clipboard className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">QC Reports</h1>
            <p className="text-[#62748E] text-base font-normal">
              Quality control inspection reports
            </p>
          </div>
        </div>
      </div>

      {/* Data Layer starts */}
      <div className="mt-7">
        <Card className="rounded-[16px] py-3 px-3 ">
          <div className="bg-[#F4F4F4] rounded-[10px] flex md:flex-row flex-col justify-between max-md:gap-3">
            <div className="flex flex-row gap-3 max-md:flex-col ">
              <div className="bg-[#D9D9D9] w-[126px] h-[126px] rounded-full flex justify-center items-center m-4 max-md:place-self-center">
                <User
                  className="fill-gray-500/80 text-gray-500/80 border-none outline-none stroke-0"
                  size={60}
                />
              </div>
              <div className="flex flex-col justify-center gap-4 max-md:pl-4">
                <div className="flex flex-col ">
                  <h2 className="text-[#000000] font-bold text-[24px]">
                    Employee Details:
                  </h2>
                  <div className="flex flex-row items-center mt-1">
                    <p className="text-[#5c5c5c] font-medium text-[16px] flex items-center gap-1">
                      ID:{" "}
                      <p className="text-[#8a8a8a]">
                        {report.upperLayerData.employeeId}
                      </p>
                    </p>
                    <Separator
                      className="mx-2 px-[1px] text-[#8a8a8a] bg-[#8a8a8a] rounded-[10px]"
                      orientation="vertical"
                    />
                    <p className="text-[#5c5c5c] font-medium text-[16px] flex items-center gap-1">
                      Name:{" "}
                      <p className="text-[#8a8a8a]">
                        {report.upperLayerData.employeeName}
                      </p>
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-[#9c9c9c]">
                    {report.upperLayerData.createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Download Employee Details Button */}
            <div className="max-md:p-2">
              <Button className="rounded-[10px] md:m-4 max-md:w-full">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <div className="mt-4 px-4">
            <h2 className="text-[#000000] font-bold text-[24px]">
              Device Information:
            </h2>
            {/* Hardware Info Layer */}
            <div className="mt-3">
              {/* Layer 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    Brand
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.brand || "N/A"}
                  </h2>
                </Card>
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    Model
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.model || "N/A"}
                  </h2>
                </Card>
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    RAM
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.ram || "N/A"}
                  </h2>
                </Card>
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    Storage
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.storage || "N/A"}
                  </h2>
                </Card>
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px] sm:col-span-2 lg:col-span-1">
                  <h3 className="text-[#808080] text-[15px] font-semibold flex gap-1 items-center justify-between flex-wrap">
                    <span>IMEI Verified Model</span>
                    <BadgeCheck className="text-[#296CFF] shrink-0" />
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.imeiVerifiedModel || "N/A"}
                  </h2>
                </Card>
              </div>
              {/* Layer 2 */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    IMEI1
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.imei1}
                  </h2>
                </Card>
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    IMEI2
                  </h3>
                  <h2 className="text-[24px] text-[#4F4F4F] font-semibold wrap-break-word">
                    {report.upperLayerData.imei2 || "N/A"}
                  </h2>
                </Card>
                <Card className="shadow-sm bg-[#F0EFEF] rounded-[6px] flex flex-col gap-1.5 py-3 px-5 min-h-[90px]">
                  <h3 className="text-[#808080] text-[15px] font-semibold">
                    Exchange Code
                  </h3>
                  <h2 className="text-[24px] text-[#155DFC] font-bold wrap-break-word">
                    {report.upperLayerData.testId}
                  </h2>
                </Card>
              </div>

              {/* Layer 3 */}
              <div className="mt-12 border border-[#F4F4F4] rounded-[10px] py-3 px-5">
                <h2 className="text-[#000000] font-bold text-[24px]">
                  Test Result:
                </h2>

                <div className="mt-3">
                  {testResArray.map((test, index) => {
                    const status = getTestStatus(test.key);
                    return (
                      <div
                        key={index}
                        className={`flex flex-row justify-between items-center px-3 py-4 mb-3  last:border-0 rounded-[16px] ${status === "Passed" ? "bg-[#F0FDF4]" : status === "Failed" ? "bg-[#FFF4F4]" : "bg-[#FEFCE8]"}`}
                      >
                        <div className="flex items-center gap-7">
                          <div className={`w-12 h-12 rounded-[16px] bg-gray-100 flex items-center justify-center text-gray-600 ${status === "Passed" ? "bg-green-100 text-green-600" : status === "Failed" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                            {test.icon}
                          </div>
                          <span className="text-[16px] font-bold text-[#0F172B]">
                            {test.testName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {status === "Passed" ? (
                            <div className="flex flex-row gap-1">
                              <Badge className="bg-[#DCFCE7] rounded-[30px] px-6 py-1.5 text-[#008236]">
                                {test.testName} is working
                              </Badge>
                              <CircleCheck className="text-[#00A63E]" />
                            </div>
                          ) : status === "Failed" ? (
                            <div className="flex flex-row gap-1">
                                <Badge className="bg-[#FFE2E2] rounded-[30px] px-4 py-1.5 text-[#C10007]">
                                    {test.testName} is not working
                                </Badge>
                                <CircleX className="text-[#E7000B]"/>
                            </div>
                          ) : (
                            <span className="text-[16px] font-medium text-gray-400">
                              N/A
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ViewQCReport;
