import { CloudSync } from "lucide-react";
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
import "./APKDownload.css";

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
    <div className="apk-download-container">
      <main className="apk-download-main">
        <div className="apk-download-content">
          {/* Image layer */}
          <img
            src="/mdt-logo.png"
            alt="APK Download"
            className="apk-logo"
          />

          {/* Layer 1 - Head */}

          <div className="apk-header">
            <span className="apk-subtitle">
              Mobitech Diagnose Tools.
            </span>
            <h2 className="apk-title">
              Diagnostics App
            </h2>
          </div>

          {/* Layer 2 - Store Links */}

          <div className="apk-store-section">
            <span className="apk-section-title">
              official store download
            </span>

            <div className="apk-store-buttons">
              <button 
                onClick={() => setShowComingSoon(true)}
                className="apk-store-button">
                <img
                  src="/google-play-logo.png"
                  alt="Google Play"
                  className="apk-store-logo"
                />
                <div className="apk-store-button-content">
                  <span className="apk-store-button-small-text">GET IT ON</span>
                  <span className="apk-store-button-large-text">
                    Google Play
                  </span>
                </div>
              </button>
              <button 
                onClick={() => setShowComingSoon(true)}
                className="apk-store-button">
                <img
                  src="/app-store-logo.png"
                  alt="App Store"
                  className="apk-store-logo"
                />
                <div className="apk-store-button-content">
                  <span className="apk-store-button-small-text">
                    Download on the
                  </span>
                  <span className="apk-store-button-large-text">
                    App Store
                  </span>
                </div>
              </button>
            </div>

            {/* Layer 3 - Divider */}

            <div className="apk-divider-container">
              <div className="apk-divider-line" />
              <span className="apk-divider-text">
                OR
              </span>
              <div className="apk-divider-line" />
            </div>

            {/* Layer 4 - APK Download Buttons */}

            <div className="apk-download-section">
              <span className="apk-section-title">
              Direct download the app
            </span>
              <div className="apk-download-buttons">
                <div className="apk-download-buttons-row">
                 
                 <button
                    onClick={() => setShowComingSoon(true)}
                    className="apk-download-button"
                  >
                    <img
                      src="/ios-logo.png"
                      alt="iOS"
                      className="apk-ios-logo"
                    />
                    <div className="apk-download-button-content">
                      <span className="apk-download-button-text">iOS</span>
                    </div>
                  </button>
                 
                  <button 
                    onClick={() => downloadApk(false)}
                    className="apk-download-button"
                  >
                    <AnimatePresence>
                      {isDownloading && downloadType === 'regular' && (
                        <motion.div
                          className="apk-shimmer"
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
                      className="apk-android-logo"
                    />
                    <div className="apk-download-button-content">
                      <span className="apk-download-button-text">Android</span>
                    </div>
                  </button>
                  
                  
                </div>

                <button 
                  onClick={() => downloadApk(true)}
                  className="apk-older-button"
                >
                  <AnimatePresence>
                    {isDownloading && downloadType === 'bc' && (
                      <motion.div
                        className="apk-shimmer"
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
                    className="apk-android-logo"
                  />
                  <div className="apk-older-button-content">
                    <span className="apk-older-button-text">OLDER VERSION APK</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CloudSync className="apk-coming-soon-icon" size={23} />
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
