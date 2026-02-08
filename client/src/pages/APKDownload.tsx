import { Button } from "@/components/ui/button";
import {  CloudSync } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const APKDownload = () => {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<'regular' | 'bc' | null>(null);
  
  const downloadApk = (isBC: boolean) => {
    setIsDownloading(true);
    setDownloadType(isBC ? 'bc' : 'regular');
    const fileName = isBC
      ? "Mobitech_Diagnose_2.2.10(BC).apk"
      : "Mobitech_Diagnose_2.2.10.apk";
    const link = document.createElement("a");
    link.href = `/apk/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadType(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-white text-white py-12 px-4">
      <main className="container mx-auto max-w-7xl">
        <div className="flex flex-col justify-center items-center h-full w-full">
          {/* Image layer */}
          <img
            src="/mdt-logo.png"
            alt="APK Download"
            className="w-[114px] h-[127px]"
          />

          {/* Layer 1 - Head */}

          <div className="mt-7 flex flex-col items-center ">
            <span className="text-[#777E90] text-[clamp(14px,4vw,20px)] font-semibold font-poppins text-center px-4">
              Mobitech Diagnose Tools.
            </span>
            <h2 className="text-[#000000] font-bold text-[clamp(24px,8vw,45px)] font-inter text-center px-4">
              Diagnostics App
            </h2>
          </div>

          {/* Layer 2 - Store Links */}

          <div className="mt-7 flex flex-col items-center ">
            <span className="text-[#000000] text-[16px] font-semibold font-poppins uppercase">
              official store download
            </span>

            <div className="mt-4 flex gap-2 sm:gap-4">
              <Button 
                onClick={() => setShowComingSoon(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-black hover:bg-gray-800 text-white px-5 py-6 sm:px-7 sm:py-7  shrink-0 rounded-[10px]">
                <img
                  src="/google-play-logo.png"
                  alt="Google Play"
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs">GET IT ON</span>
                  <span className="text-sm sm:text-lg font-semibold">
                    Google Play
                  </span>
                </div>
              </Button>
              <Button 
                onClick={() => setShowComingSoon(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-black hover:bg-gray-800 text-white px-5 py-6 sm:px-7 sm:py-7  shrink-0 rounded-[10px]">
                <img
                  src="/app-store-logo.png"
                  alt="App Store"
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs">
                    Download on the
                  </span>
                  <span className="text-sm sm:text-lg font-semibold">
                    App Store
                  </span>
                </div>
              </Button>
            </div>

            {/* Layer 3 - Divider */}

            <div className="flex items-center w-full max-w-md my-8">
              <div className="flex-1 h-px bg-[#C7C7C7]" />
              <span className="px-4 text-[#777E90] font-semibold text-sm">
                OR
              </span>
              <div className="flex-1 h-px bg-[#C7C7C7]" />
            </div>

            {/* Layer 4 - APK Download Buttons */}

            <div className="flex flex-col items-center gap-4">
              <span className="text-[#000000] text-[16px] font-semibold font-poppins uppercase">
              Direct download the app
            </span>
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2 sm:gap-4 w-full max-w-md">
                  <Button 
                    onClick={() => downloadApk(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-6 sm:px-6 sm:py-6 shrink-0 rounded-[10px] relative overflow-hidden"
                  >
                    <AnimatePresence>
                      {isDownloading && downloadType === 'regular' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '200%' }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            repeat: 2,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <img
                      src="/android-logo.png"
                      alt="Android"
                      className="h-3.5 relative z-10"
                    />
                    <div className="flex relative z-10">
                      <span className="text-sm sm:text-lg font-semibold uppercase">Android</span>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setShowComingSoon(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-black hover:bg-gray-800 text-white px-5 py-6 sm:px-6 sm:py-6 shrink-0 rounded-[10px]"
                  >
                    <img
                      src="/ios-logo.png"
                      alt="iOS"
                      className="h-6"
                    />
                    <div className="flex">
                      <span className="text-sm sm:text-lg font-semibold">iOS</span>
                    </div>
                  </Button>
                </div>

                <Button 
                  onClick={() => downloadApk(true)}
                  className="flex items-center gap-2.5 bg-[#296CFF] hover:bg-[#1E4ED8] text-white px-4 py-6 sm:px-6 rounded-lg shrink-0 relative overflow-hidden"
                >
                  <AnimatePresence>
                    {isDownloading && downloadType === 'bc' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: 2,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <img
                    src="/android-logo.png"
                    alt="Android"
                    className="h-3.5 relative z-10"
                  />
                  <div className="flex flex-col items-start relative z-10">
                    <span className="text-xs sm:text-sm font-semibold">OLDER VERSION APK</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center">
              <CloudSync className="mx-auto mb-2 text-red-400" size={23} />
            </div>
            <AlertDialogTitle>Coming Soon!</AlertDialogTitle>
            <AlertDialogDescription>
              This feature is currently under development and will be available soon. 
              Stay tuned for updates!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default APKDownload;
