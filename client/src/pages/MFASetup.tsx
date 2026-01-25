import { Button } from "@/components/ui/button";
import { apiJson, jsonHeaders } from "@/lib/api";
import {
  CheckCircle,
  KeyRound,
  Loader2,
  OctagonAlert,
  QrCode,
  Shield,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const DotsLoader = ({ label }: { label?: string }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-blue-600"
            animate={{
              y: [0, -6, 0],
              scale: [1, 1.35, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      {label ? (
        <motion.p
          className="text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {label}
        </motion.p>
      ) : null}
    </div>
  );
};

const MFASetup = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"generate" | "verify" | "complete">(
    "generate",
  );
  const [isVerifying, setVerifying] = useState(false);
  const searchParams = useSearchParams()[0];

  const handleCodeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setCode(digitsOnly);
  };

  async function fetchAndSetParams() {
    setLoading(true);
    const userId = searchParams.get("uid");
    setUid(userId);
    setIsGenerating(true);
    try {
      const { response, data } = await apiJson<any>("/sentinel/mfa/setup", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          userId: userId,
        }),
      });

      if (response.ok) {
        setQrCodeUrl(data.qrCodeDataUrl);
        setStep("verify");
      } else {
        toast.error(data.message || "Error initiating MFA setup.");
      }
    } catch (error) {
      toast.error("Error loading data. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchAndSetParams().finally(() => {
      setLoading(false);
    });
  }, []);

  async function resetSetup() {
    setStep("generate");
    setQrCodeUrl(null);
    fetchAndSetParams();
  }

  async function handleVerify() {
    setVerifying(true);
    if (!uid) {
      toast.error("User ID is missing. Please retry the setup.");
      setVerifying(false);
      return;
    }
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      setVerifying(false);
      return;
    }
    try {
      const { response, data } = await apiJson<any>("/sentinel/mfa/verify", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          userId: uid,
          token: code,
        }),
      });

      if (response.status === 400) {
        toast.error(
          data.message || "Error verifying MFA code. Please try again.",
        );
      } else if (response.status === 200) {
        toast.success("MFA setup and verified successfully!");
        setStep("complete");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    } catch (error) {
      console.error("MFA verify error:", error);
      toast.error("Error verifying MFA code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="mfa-loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <DotsLoader label="Preparing MFA setup..." />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
  if (!uid) {
    return (
      <div className="h-screen flex flex-col gap-4 items-center justify-center">
        <OctagonAlert className="w-12 h-12 text-red-500" />
        <p className="text-gray-500 text-lg">Error loading data...</p>
        <Button className="ml-4">
          <Link to="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className="h-screen flex flex-col gap-4 items-center justify-center">
        <OctagonAlert className="w-12 h-12 text-red-500" />
        <p className="text-gray-500 text-lg">Error initiating MFA setup...</p>
        <Button className="ml-4" onClick={fetchAndSetParams}>
          Retry
        </Button>

        <p className="text-sm text-gray-500">
          If the problem still persists please contact admin
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Multi-Factor Authentication
              </h1>
              <p className="text-blue-100">Secure your account with 2FA</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-2 ${step === "generate" ? "text-blue-600" : step === "verify" || step === "complete" ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "generate" ? "bg-blue-100 text-blue-600" : step === "verify" || step === "complete" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                1
              </div>
              <span className="font-medium">Generate QR</span>
            </div>

            <div
              className={`w-16 h-1 rounded-full ${step === "verify" || step === "complete" ? "bg-green-500" : "bg-gray-200"}`}
            />

            <div
              className={`flex items-center gap-2 ${step === "verify" ? "text-blue-600" : step === "complete" ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "verify" ? "bg-blue-100 text-blue-600" : step === "complete" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                2
              </div>
              <span className="font-medium">Verify Code</span>
            </div>

            <div
              className={`w-16 h-1 rounded-full ${step === "complete" ? "bg-green-500" : "bg-gray-200"}`}
            />

            <div
              className={`flex items-center gap-2 ${step === "complete" ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "complete" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                {step === "complete" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  "3"
                )}
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Generate QR Code */}
          {step === "generate" && (
            <div className="text-center">
              <QrCode className="h-16 w-16 text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Set Up Authenticator App
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                First, you'll need to generate a QR code to connect your
                authenticator app like Google Authenticator or Authy.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-blue-900 mb-2">
                  Before you continue
                </h3>
                <p className="text-blue-800 text-sm">
                  Make sure you have an authenticator app installed on your
                  phone (Google Authenticator, Authy, Microsoft Authenticator,
                  etc.)
                </p>
              </div>

              <div className="mt-2 min-h-14 flex items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  {isGenerating ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <DotsLoader label="Generating QR code..." />
                    </motion.div>
                  ) : (
                    <motion.p
                      key="waiting"
                      className="text-sm text-gray-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      Starting setup...
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Step 2: Scan QR and Verify */}
          {step === "verify" && qrCodeUrl && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Scan QR Code & Verify
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block mb-4">
                    <img
                      src={qrCodeUrl}
                      alt="MFA QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                {/* Verification */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Instructions:
                    </h3>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>1. Open your authenticator app</li>
                      <li>2. Tap "Add account" or "+"</li>
                      <li>3. Scan the QR code</li>
                      <li>4. Enter the 6-digit code below</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleVerify}
                      disabled={isVerifying || code.length !== 6}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6  bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-5 w-5" />
                          Verify & Enable
                        </>
                      )}
                    </Button>

                    <Button
                      variant={"destructive"}
                      onClick={resetSetup}
                      className="px-6 py-3 w-full border border-gray-300 hover:bg-gray-50  font-medium rounded-lg transition-colors duration-200"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFASetup;
