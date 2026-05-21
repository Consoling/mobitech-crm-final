"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useModelData } from "./components/GetModelData";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, IndianRupee } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { SYS_VAR } from "@/constants/const";

const DeclarationPage = () => {
  const params = useParams();
  const orderId = params.id as string;
  
  const [checked, setChecked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [agreementData, setAgreementData] = useState<{
    id?: string;
    orderId?: string;
    smc?: string;
    variant?: string;
    imei1?: string;
    imei2?: string;
    bluetooth?: string;
    gps?: string;
    wifi?: string;
    proximity?: string;
    multiTouch?: string;
    screenCalibration?: string;
    speaker?: string;
    earReceiver?: string;
    microphone?: string;
    frontCamera?: string;
    backCamera?: string;
    sim?: string;
    fingerprint?: string;
    chargingPort?: string;
    audioJack?: string;
    finalAmount?: number | string;
    isAccepted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
  } | null>(null);

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const [phoneSheetOpen, setPhoneSheetOpen] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Zod schema for last4
  const last4Schema = z.object({ last4: z.string().regex(/^[0-9]{4}$/, "Please enter exactly 4 digits") });

  const { control, handleSubmit, setValue, watch, formState } = useForm({
    resolver: zodResolver(last4Schema),
    defaultValues: { last4: "" },
  });

  const last4 = watch("last4");

  // removed inline handler - Controller will manage input changes

  // Helper: sanitize backend URL from env (strip quotes, fix slashes, remove trailing slash)
  const sanitizeBackendUrl = (raw?: string | null) => {
    if (!raw) return "";
    let u = raw.trim();
    // strip surrounding single or double quotes
    if ((u.startsWith("'") && u.endsWith("'")) || (u.startsWith('"') && u.endsWith('"'))) {
      u = u.slice(1, -1);
    }
    // if protocol missing or malformed like 'http:/host', fix it
    if (!/^https?:\/\//i.test(u)) {
      // replace any leading protocol with proper double slash
      u = u.replace(/^https?:\/+/, (m) => m.replace(/\/+$/, "") + "//");
      if (!/^https?:\/\//i.test(u)) {
        u = "http://" + u;
      }
    }
    // remove trailing slashes
    u = u.replace(/\/+$/g, "");
    return u;
  };

  useEffect(() => {
    // Fetch agreement text from backend
    if (!orderId) return;
    
    setIsLoading(true);
    setHasError(false);
    
    fetch(`${SYS_VAR.BACKEND_URL_V2}/pickup/fetch-declaration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(async (res) => {
        if (res.status === 404) {
          setHasError(true);
          setIsLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch declaration");
        }
        const data = await res.json();
        
        setAgreementData(data);
       
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching declaration:", error);
        setHasError(true);
        setIsLoading(false);
      });
  }, [orderId]);

  // Only call useModelData after agreementData is loaded
  const smc = (agreementData && !isLoading && agreementData.smc) ? agreementData.smc : null;

 
  const { mobileData, mobileDataLoading } = useModelData(smc);


  // Check if user scrolled to bottom of sheet
  const handleScroll = () => {
    const el = sheetContentRef.current;
    if (el) {
      setScrolledToBottom(el.scrollHeight - el.scrollTop === el.clientHeight);
    }
  };

  // Open phone confirmation sheet (triggered when user clicks Accept)
  const openPhoneConfirm = () => {
    setPhoneError(null);
    setValue("last4", "", { shouldDirty: false, shouldValidate: false });
    setPhoneSheetOpen(true);
  };

  // Final submit after user enters last 4 digits
  const onSubmit = handleSubmit(async (values: { last4: string }) => {
    const last4Val = values.last4;
    if (!orderId) return;
    setPhoneError(null);

    // if agreementData has a phone/mobile number, validate match
    const phone = (agreementData?.mobileNumber as string) || (agreementData?.phoneNumber as string) || null;
    if (phone && phone.length >= 4) {
      const expected = phone.slice(-4);
      if (expected !== last4Val) {
        setPhoneError("Digits do not match our records");
        return;
      }
    }

    setIsAccepting(true);
    try {
      const response = await fetch(
        `${SYS_VAR.BACKEND_URL_V2}/pickup/accept-declaration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, last4: last4Val }),
        }
      );

      if (response.ok) {
        // close sheet and reload
        setPhoneSheetOpen(false);
        window.location.reload();
      } else {
        console.error("Failed to accept declaration");
        setIsAccepting(false);
        setPhoneError("Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting declaration:", error);
      setIsAccepting(false);
      setPhoneError("Network error. Please try again.");
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Loading Overlay - Initial Data Fetch */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay - PhonePe Style */}
      {isAccepting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold">Processing...</p>
          </div>
        </div>
      )}

      {/* Error Screen - 404 */}
      {hasError && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
              <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="24" fill="#ef4444" />
                <path
                  d="M16 16l16 16M32 16L16 32"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Uh-oh!
              </h2>
              <p className="text-gray-600 text-base">
                Invalid Report
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {agreementData?.isAccepted && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="24" fill="#22c55e" />
                <path
                  d="M14 24l8 8L34 18"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                All Done!
              </h2>
              <p className="text-gray-600 text-lg">
                Your exchange has been confirmed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show if not accepted and no error */}
      {!agreementData?.isAccepted && !hasError && !isLoading && (
        <>
          {/* Main content area */}
          <div className="fixed top-0 left-0 w-full border-b border-black/20 bg-gray-100 pt-5 pb-3 px-4 z-40">
            <h1 className="text-xl font-semibold mb-2">Verify to Confirm</h1>
          </div>

          <div className="flex-1 overflow-auto pt-16">
            {mobileDataLoading && (
              <div className="mt-8 py-2 border border-gray-300 bg-gray-200 mx-4 rounded-lg">
                <div className="flex items-center space-x-4 px-2">
                  <Skeleton className="w-20 h-20 rounded-md bg-gray-300" />
                  <div className="flex flex-col flex-1">
                    <Skeleton className="h-6 w-32 mb-2 bg-gray-300" />
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                  </div>
                </div>
              </div>
            )}
            {!mobileDataLoading && mobileData && (
              <>
                <div className="mt-8 py-2 border border-gray-300 bg-gray-200 mx-4 rounded-lg">
                  <div className="flex items-center space-x-4 px-2 ">
                    <img
                      src={mobileData.imageUrl}
                      alt={mobileData.model}
                      className="w-20 h-20 rounded-md object-contain bg-gray-200 py-2"
                    />
                    <div className="flex flex-col ">
                      <span className="text-base tracking-wide font-semibold ">
                        {mobileData.model}
                      </span>
                      <div className="mt-1 bg-white/50 px-2 py-0.5 rounded-md flex flex-col font-semibold ">
                        {/* <span className="text-sm text-gray-600 ">
                        Variant: {agreementData?.variant}
                      </span>{" "} */}
                        <span className="text-sm text-gray-600 tracking-wide">
                          IMEI:{" "}
                          {agreementData?.imei1 || agreementData?.imei2 || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-8  py-4 px-3 border border-gray-300 bg-gray-200 mx-3 rounded-lg  tracking-wide">
              <div className="flex justify-between">
                <span className=" font-semibold">Price Details:</span>
                <IndianRupee className="text-blue-600" />
              </div>

              <div className="mt-7 mb-6 flex justify-between font-semibold">
                <span>Final Amount</span>
                <span>
                  ₹
                  {typeof agreementData?.finalAmount === "number"
                    ? agreementData.finalAmount.toLocaleString("en-IN")
                    : Number(agreementData?.finalAmount || 0).toLocaleString(
                        "en-IN"
                      )}
                </span>
              </div>

              <div className="bg-white/70 rounded-md px-3 py-3 flex  items-center  gap-3">
                <div className="bg-black rounded-full w-3 h-3"></div>
                <span className="font-normal text-sm text-gray-700 ">
                  The value is based on phone's diagnosis report
                </span>
              </div>
            </div>

            <div className="mt-8 py-4 px-3 border border-gray-300 bg-gray-200 mx-3 rounded-lg mb-24">
              <div className="flex justify-between ">
                <span className="font-semibold mb-7 block text-gray-800">
                  Test Results
                </span>
                <FileText className="text-blue-600" />
              </div>
              <div className="flex flex-col gap-2 bg-white">
                {[
                  { key: "bluetooth", label: "Bluetooth" },
                  { key: "gps", label: "GPS" },
                  { key: "wifi", label: "WiFi" },
                  { key: "proximity", label: "Proximity Sensor" },
                  { key: "multiTouch", label: "Multi-Touch" },
                  { key: "screenCalibration", label: "Screen Calibration" },
                  { key: "speaker", label: "Speaker" },
                  { key: "earReceiver", label: "Ear Receiver" },
                  { key: "microphone", label: "Microphone" },
                  { key: "frontCamera", label: "Front Camera" },
                  { key: "backCamera", label: "Back Camera" },
                  { key: "sim", label: "SIM" },
                  { key: "fingerprint", label: "Fingerprint" },
                  { key: "chargingPort", label: "Charging Port" },
                  { key: "audioJack", label: "Audio Jack" },
                ].map(({ key, label }) => {
                  const result = agreementData?.[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2.5  rounded-md font-semibold"
                    >
                      <span className="text-sm text-gray-700">{label}</span>
                      {result === "pass" ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 20 20"
                          >
                            <circle cx="10" cy="10" r="10" fill="#22c55e" />
                            <path
                              d="M6 10.5l2.5 2.5L14 7.5"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : result === "fail" ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 20 20"
                          >
                            <circle cx="10" cy="10" r="10" fill="#ef4444" />
                            <path
                              d="M7 7l6 6M13 7l-6 6"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                            Unsupported
                          </span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="fixed bottom-0 left-0 w-full bg-gray-100 border-t border-black/20 flex flex-col items-center px-4 py-3 z-50">
            <div className="flex items-center w-full mb-2">
              <Checkbox
                className="border-gray-400"
                checked={checked}
                onCheckedChange={(state) => setChecked(state === true)}
                id="confirm-checkbox"
              />
              <label htmlFor="confirm-checkbox" className=" text-sm  py-2 pl-3">
                I confirm my device details and agree to
                <span
                  className="text-blue-600 font-semibold text-sm pl-1 underline"
                  onClick={() => setSheetOpen(true)}
                >
                  Declaration
                </span>
              </label>
            </div>
            <div className="flex w-full gap-2">
              <Button
                onClick={() => setRejectDialogOpen(true)}
                className="flex-1 text-blue-600 py-5 bg-white border-gray-300 border hover:bg-gray-50"
              >
                Reject
              </Button>
              <Button
                className="flex-1 py-5"
                disabled={!checked}
                onClick={openPhoneConfirm}
                style={{
                  backgroundColor: checked ? "#2563eb" : "#d1d5db",
                  color: "white",
                }}
              >
                Accept
              </Button>
            </div>
          </div>

          {/* Reject Confirmation Dialog */}
          <AlertDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to reject this device declaration. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white text-gray-700 hover:bg-gray-100">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700">
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Declaration Sheet */}
          {/* Phone confirmation Sheet (asks last 4 digits) */}
          <Sheet open={phoneSheetOpen} onOpenChange={setPhoneSheetOpen}>
            <SheetContent
              side="bottom"
              className="max-h-[40vh] flex flex-col [&>button]:hidden"
            >
              <SheetHeader className="sticky top-0 bg-white z-10 pb-3 border-b border-gray-300 flex flex-row items-center justify-between">
                <SheetTitle className="text-lg font-semibold">
                  Confirm Phone
                </SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="text-xl">✕</span>
                  </Button>
                </SheetClose>
              </SheetHeader>
              <div className="p-4 flex flex-col gap-4">
                <p className="text-sm text-gray-700">
                  Enter the last 4 digits of your phone number to confirm.
                </p>
                <div className="w-full flex justify-center">
                  <Controller
                    control={control}
                    name="last4"
                    render={({ field }) => (
                      <InputOTP
                        maxLength={10}
                        value={`XXXXXX${field.value}`}
                        onChange={(value) => {
                          // Extract only the last 4 characters (user input)
                          const userInput = value.slice(6);
                          field.onChange(userInput);
                          if (phoneError) setPhoneError(null);
                        }}
                      >
                        <InputOTPGroup>
                          {/* First 6 slots - pre-filled with X and disabled */}
                          {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <InputOTPSlot 
                              key={idx} 
                              index={idx} 
                              className="bg-gray-50 text-gray-600" 
                            />
                          ))}
                          {/* Last 4 slots - for user input */}
                          {[6, 7, 8, 9].map((idx) => (
                            <InputOTPSlot 
                              key={idx} 
                              index={idx} 
                              className="bg-white text-gray-900" 
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                </div>
                {phoneError && <div className="text-red-600 text-sm text-center">{phoneError}</div>}

                <div className="mt-2">
                  <Button
                    className="w-full bg-blue-600 h-10"
                    onClick={() => onSubmit()}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent
              side="bottom"
              className="max-h-[70vh] flex flex-col [&>button]:hidden"
            >
              <SheetHeader className="sticky top-0 bg-white z-10 pb-3 border-b border-gray-300 flex flex-row items-center justify-between">
                <SheetTitle className="text-lg font-semibold">
                  Declaration
                </SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="text-xl">✕</span>
                  </Button>
                </SheetClose>
              </SheetHeader>
              <div
                className="overflow-auto flex-1"
                onScroll={handleScroll}
                ref={sheetContentRef}
              >
                <div className="mt-3 text-sm whitespace-pre-line px-4 flex flex-col pb-5 ">
                  <span className="font-semibold text-lg mb-3">
                    Declaration
                  </span>
                  <span className="text-base ">
                    I confirm the following details about my phone:
                  </span>

                  {mobileDataLoading && (
                    <div className="mt-8 py-2 border border-gray-300 bg-gray-200 mx-4 rounded-lg">
                      <div className="flex items-center space-x-4 px-2">
                        {/* <Skeleton className="w-20 h-20 rounded-md bg-gray-300" /> */}
                        <div className="flex flex-col flex-1">
                          <Skeleton className="h-6 w-32 mb-2 bg-gray-300" />
                          <Skeleton className="h-4 w-24 bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  {!mobileDataLoading && mobileData && (
                    <>
                      <div className="mt-6 py-2 border border-gray-300 bg-gray-200  rounded-lg">
                        <div className="flex items-center space-x-4 px-5 py-2 ">
                          {/* <img
                    src={mobileData.imageUrl}
                    alt={mobileData.model}
                    className="w-20 h-20 rounded-md object-contain bg-gray-200 py-2"
                  /> */}
                          <div className="flex flex-col ">
                            <span className="text-base tracking-wide font-semibold ">
                              {mobileData.model}
                            </span>
                            <div className="mt-1 bg-white/50 px-2 py-0.5 rounded-md flex flex-col font-semibold ">
                              {/* <span className="text-sm text-gray-600 ">
                        Variant: {agreementData?.variant}
                      </span>{" "} */}
                              <span className="text-sm text-gray-600 tracking-wide">
                                IMEI:{" "}
                                {agreementData?.imei1 ||
                                  agreementData?.imei2 ||
                                  ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="font-normal ">
                    <p className="text-base  px-1 mt-6">
                      I confirm that device which I am trading in under the sell
                      back program is a genuine product and is not a refurbished
                      or counterfeit, free from any and all encumbrances, liens,
                      attachements,disputes. legal flaws, exchange or any
                      agreement of sale etc. and I have got the clear marketable
                      title of the said device.
                    </p>
                    <p className="text-base  px-1 mt-6">
                      I further represent and warrant that neither have I
                      removed, tampered with, obliterated, or altered the IMEI
                      number or mobile equipment identification number of the
                      device or Operating System of the device. nor do I have
                      reasons to believe that the IMEI number or mobile
                      equipment identification number of the Product or
                      Operating System of the Product has been removed, tampered
                      with, obliterated, or altered. I also represent and
                      warrant that that no software or hardware has been used or
                      configured to remove, tamper, obliterate, or alter the
                      IMEI number or mobile equipment identification number of
                      the device. In case of any claims or actions in relation
                      to, or arising out of the IMEI number of the device,
                      Mobitech is entitled to disclose my personal information
                      and Order details to any third party authorized under law
                      or Mobitech policies to receive such information.
                    </p>
                    <p className="text-base  px-1 mt-6">
                      I agree to indemnify and keep indemnifying Mobitech, its
                      affiliates, distributors. the retailer and any future
                      buyer of the device against all or any third-party claims,
                      demands, costs, expenses including attorney fees which may
                      be suffered, incurred, undergone or sustained by Mobitech,
                      its affiliates, the retailer or any future buyer due to
                      usage of the device by me till date and I undertake to
                      make good the same.
                    </p>
                    <p className="text-base  px-1 mt-6">
                      I confirm that all the data in the said device will be
                      erased by me before handing it over under the exchange
                      program. I also confirm that in spite of erasing the data
                      manually/electronically, if any data is still accessible
                      due any technical reason, Mobitech or the retailer shall
                      not be responsible for the same and I will not approach
                      Mobitech.com or the retailer for any retrieval or misuse
                      of the data.
                    </p>
                    <p className="text-base  px-1 mt-6">
                      I hereby give my consent that my personal information that
                      I have provided in connection with this exchange program
                      might be processed, transferred and retained by the
                      retailer and other entities involved in managing the
                      program for the purposes of validating the information
                      that I provided herein and for the administration of the
                      program,
                    </p>
                    <p className="text-base  px-1 mt-6">
                      I understand once a device is sent by me to the buyer, in
                      no scenario will this device be returned back to me.
                    </p>
                    <p className="text-base  px-1 mt-6">
                      I understand that different prices will be provided for
                      different devices in different conditions.
                    </p>
                    <p className="text-base  px-1 mt-6">
                      In relation to shipping charges of my device I understand
                      that I will have to pay pickup charges towards shipping
                      charges of the device as mentioned in the checkout page,
                      The pickup charges will be over and above the sell back
                      value of the old device. I understand and agree that in
                      the event that the trade-in offer is cancelled as a result
                      of the old device failing any of the checks for this
                      program mentioned in this Terms and Conditions - I may be
                      able, at the discretion of Mobitech, to receive a refund
                      of the pickup charges.
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default DeclarationPage;
