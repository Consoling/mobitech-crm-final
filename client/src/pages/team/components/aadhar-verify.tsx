import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { apiJson } from "@/lib/api";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AadharVerifyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any; // Replace with your form type
  employeeLabelClassName?: string;
  setAadharVerifyDialogOpen: (open: boolean) => void;
    aadharData: any; // Replace with your Aadhar data type
    setAadharData: (data: any) => void; // Replace with your Aadhar data type
    handleAadharVerification: (status: "pass" | "fail") => void;
}

const AadharVerifyDialog = ({
  open,
  onOpenChange,
  form,
  employeeLabelClassName,
  setAadharVerifyDialogOpen,
  aadharData,
  setAadharData,
  handleAadharVerification
}: AadharVerifyProps) => {
  const [step, setStep] = useState(1);
  const [otpValue, setOtpValue] = useState("");
  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  const [isFetchingAadharData, setIsFetchingAadharData] = useState(false);

  const resetDialogState = () => {
    setStep(1);
    setOtpValue("");
    setIsOtpInvalid(false);
    setResendCountdown(0);
    setIsResending(false);
    setIsSending(false);
    form.setValue("aadharNumber", "");
    form.clearErrors("aadharNumber");
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    setShowCloseConfirm(true);
  };

  useEffect(() => {
    if (!open || resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, resendCountdown]);

  useEffect(() => {
    if (!open) {
      setShowCloseConfirm(false);
    }
  }, [open]);

  const verifyAadhar = async () => {
    
    const aadharNumber = form.getValues().aadharNumber ?? "";
    console.log("Verifying Aadhaar number:", aadharNumber);
    setIsSending(true);
    if (aadharNumber.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    try {
      const { response, data } = await apiJson<{
        status_code: number;
        request_id: string;
        message: string;
      }>(`/team/add-employee/get-aadhar-otp`, {
        method: "POST",
        body: JSON.stringify({ aadharId: aadharNumber }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.status !== 200) {
        toast.error(
          data.message || "Invalid Aadhaar number. Please try again.",
        );
        return;
      } else {
        setStep(2);
        setResendCountdown(30);
        setOtpValue("");
        setRequestId(data.request_id);
        toast.success(
          "OTP sent to the registered mobile number linked with the Aadhaar.",
        );
      }
    } catch (error) {
      toast.error("Failed to verify Aadhaar. Please try again.");
      return;
    } finally {
      setIsSending(false);
    }
  };

  const resendOtp = async () => {
    const aadharNumber = form.getValues().aadharNumber ?? "";

    if (aadharNumber.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setIsResending(true);
    try {
      const { response, data } = await apiJson<{
        status_code: number;
        request_id: string;
        message: string;
      }>(`/team/add-employee/get-aadhar-otp`, {
        method: "POST",
        body: JSON.stringify({ aadharId: aadharNumber }),
        headers: { "Content-Type": "application/json" },
      });
      if (response.status !== 200) {
        toast.error(
          data.message || "Invalid Aadhaar number. Please try again.",
        );
        return;
      } else {
        setResendCountdown(30);
        setOtpValue("");
        setRequestId(data.request_id);
        toast.success(
          "OTP resent to the registered mobile number linked with the Aadhaar.",
        );
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
      return;
    } finally {
      setIsResending(false);
    }
  };


  const verifyAadharOtp = async () => {
    setIsFetchingAadharData(true);
    try {
      const { data } = await apiJson<{
        status_code: number;
        message: string;
        data : any;
      }>(`/team/add-employee/verify-aadhar-otp`, {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, otp: otpValue }),
        headers: { "Content-Type": "application/json" },
      });

      if (data.status_code !== 200) {
        toast.error(data.message || "Invalid OTP. Please try again.");
        setOtpValue("");
        setIsOtpInvalid(true);
        return;
      } else {
        toast.success("OTP verified successfully");
        setAadharData(data.data);
        setStep(3);
      }
    } catch (error) {
      toast.error("Failed to verify OTP. Please try again.");
      return;
    } finally {
      setIsFetchingAadharData(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={`sm:max-w-139.5  rounded-[10px] gap-8 ${step === 3 ? "" : "sm:max-h-99"}`}>
        <DialogHeader>
          {step === 1 && (
            <>
              <DialogTitle className="text-2xl font-semibold text-[#1A1A21] text-center">
                Verify Aadhar
              </DialogTitle>
              <DialogDescription className="text-center  text-[#8C94A6] font-normal text-base">
                Please enter aadhar number for verification
              </DialogDescription>
            </>
          )}
          {step === 2 && (
            <>
              <DialogTitle className="text-2xl font-semibold text-[#1A1A21] text-center">
                Mobile No. Verification
              </DialogTitle>

              <DialogDescription className="text-center  text-[#8C94A6] font-normal text-base">
                Please enter the OTP sent to your phone number.
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        {showCloseConfirm ? (
          <div className="absolute inset-0 z-100 flex items-center justify-center rounded-[10px] bg-black/40 p-4">
            <div className="w-full max-w-md rounded-[10px] bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-[#101828]">
                Close Aadhaar verification?
              </h3>
              <p className="mt-2 text-sm text-[#475467]">
                Are you sure you want to close this dialog? All entered Aadhaar
                and OTP values will be cleared.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCloseConfirm(false)}
                  className="min-w-24"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    resetDialogState();
                    setShowCloseConfirm(false);
                    setAadharVerifyDialogOpen(false);
                  }}
                  className="min-w-24"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`flex w-123.25 flex-col items-center gap-5 ${showCloseConfirm ? "pointer-events-none opacity-50 blur-lg" : "pointer-events-auto opacity-100"}`}
        >
          {step === 1 && (
            <>
              <FormField
                control={form.control}
                name="aadharNumber"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className={employeeLabelClassName}>
                      Aadhaar Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter 12-digit Aadhaar number"
                        inputMode="numeric"
                        readOnly={isSending}
                        maxLength={12}
                        className="h-14 w-full rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                        onChange={(event) => {
                          const digitsOnly = event.target.value.replace(
                            /\D/g,
                            "",
                          );
                          field.onChange(digitsOnly);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                disabled={isSending}
                onClick={() => {
                  const aadharNumber = form.getValues().aadharNumber ?? "";
                  if (aadharNumber.length !== 12) {
                    toast.error(
                      "Please enter a valid 12-digit Aadhaar number.",
                    );
                    return;
                  } else {
                    verifyAadhar();
                  }
                }}
                className="w-73.5 h-9 bg-[#00c950] text-sm font-semibold text-white hover:bg-[#29ca4c] my-4"
              >
                {isSending ? <Loader2 className="animate-spin" /> : "Next"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div
                className={`flex justify-center ${isOtpInvalid ? "otp-shake" : ""}`}
              >
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  readOnly={isFetchingAadharData}
                  onChange={(value) => {
                    setOtpValue(value);
                    if (isOtpInvalid) {
                      setIsOtpInvalid(false);
                    }
                  }}
                  containerClassName="gap-3"
                >
                  <InputOTPGroup className="gap-3">
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-16.75 w-17 rounded-[6px] border p-4 text-lg font-semibold ${isOtpInvalid ? "border-[#EF4444] text-[#EF4444]" : "border-[#D0D5DD] text-[#101828]"}`}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-xs font-semibold text-[#667085]">
                Resend available in 00:
                {String(resendCountdown).padStart(2, "0")}
              </p>
              <div
                className={`flex flex-col items-center gap-2.5 transition-opacity ${resendCountdown > 0 ? "opacity-60 pointer-events-none" : "opacity-100"}`}
              >
                <span className="text-[#7B7D86] font-semibold text-xs">
                  Didn't receive a code? Check SMS
                </span>

                <button
                  type="button"
                  disabled={resendCountdown > 0 || isResending}
                  className="hover:cursor-pointer bg-[#0A0A0A] py-2 px-4 rounded-[6px] w-20 h-8 text-[8px] font-semibold text-white hover:bg-[#1A1A21] disabled:cursor-not-allowed"
                  onClick={resendOtp}
                >
                  Resend OTP
                </button>

                <div className="w-127.5 border border-[#E9E9E9]" />
                <Button
                  type="button"
                  disabled={isFetchingAadharData}
                  onClick={() => {
                    if (otpValue.length !== 6) {
                      setIsOtpInvalid(true);
                      toast.error("Please enter the 6-digit OTP.");
                      return;
                    } else if (!requestId) {
                      toast.error(
                        "Invalid request. Please resend OTP and try again.",
                      );
                      return;
                    } else {
                      verifyAadharOtp();
                    }
                  }}
                  className="w-73.5 h-9 bg-[#00c950] text-sm font-semibold text-white hover:bg-[#29ca4c] my-4"
                >
                  {isFetchingAadharData ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </div>
            </>
          )}
          {step === 3 && aadharData && (
            <div className="w-full max-w-4xl rounded-xl border border-[#E4E7EC] bg-white shadow-sm">
              <div className="grid grid-cols-1 gap-6 p-4 ">
                <div className="flex justify-center ">
                  <div className="w-28 h-36 md:w-32 md:h-36 shrink-0 border-4 border-blue-200 bg-white overflow-hidden rounded-none">
                    {aadharData.profile_image ? (
                      <img
                        src={`data:image/jpeg;base64,${aadharData.profile_image}`}
                        alt="Aadhar Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No Photo
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base md:text-lg text-[#101828]">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1 rounded-lg border bg-[#F9FAFB] p-3">
                        <p className="text-xs md:text-sm text-gray-500">Full Name</p>
                        <p className="font-medium text-sm md:text-base text-[#101828]">
                          {aadharData.full_name}
                        </p>
                      </div>
                      <div className="space-y-1 rounded-lg border bg-[#F9FAFB] p-3">
                        <p className="text-xs md:text-sm text-gray-500">Gender</p>
                        <p className="font-medium text-sm md:text-base text-[#101828]">
                          {aadharData.gender === "M" ? "Male" : "Female"}
                        </p>
                      </div>
                      <div className="space-y-1 rounded-lg border bg-[#F9FAFB] p-3">
                        <p className="text-xs md:text-sm text-gray-500">Date of Birth</p>
                        <p className="font-medium text-sm md:text-base text-[#101828]">
                          {aadharData.dob}
                        </p>
                      </div>
                      <div className="space-y-1 rounded-lg border bg-[#F9FAFB] p-3">
                        <p className="text-xs md:text-sm text-gray-500">Aadhaar Number</p>
                        <p className="font-medium text-sm md:text-base text-[#101828]">
                          {aadharData.aadhaar_number}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-base md:text-lg text-[#101828]">
                      Address Details
                    </h4>
                    <div className="rounded-lg border bg-[#F9FAFB] p-3 md:p-4">
                      <p className="whitespace-pre-wrap text-sm md:text-base text-[#344054]">
                        {[
                          aadharData.address.house,
                          aadharData.address.street,
                          aadharData.address.loc,
                          aadharData.address.vtc,
                          aadharData.address.dist,
                          aadharData.address.state,
                          aadharData.address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t bg-white p-4 md:p-6">
                <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant="destructive"
                    onClick={() => {handleAadharVerification("fail") 
                        resetDialogState();}
                    }
                    className="h-11 md:h-12 text-sm md:text-base"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {handleAadharVerification("pass")
                        resetDialogState();
                    }}
                    className="h-11 md:h-12 text-sm md:text-base bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AadharVerifyDialog;
