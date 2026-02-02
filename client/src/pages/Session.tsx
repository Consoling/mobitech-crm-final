import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Clock, Loader2, LogOut, MapPin, Monitor, Network, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";


interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

const getDeviceIcon = (device: string | null, browser: string | null, os: string | null, userAgent: string | null) => {
  const deviceStr = (device || browser || os || userAgent || '').toLowerCase();
  
  // Check for tablets
  if (deviceStr.includes('ipad') || deviceStr.includes('tablet')) {
    return Tablet;
  }
  
  // Check for mobile devices
  if (deviceStr.includes('iphone') || deviceStr.includes('android') || 
      deviceStr.includes('mobile') || deviceStr.includes('ios')) {
    return Smartphone;
  }
  
  // Default to desktop/monitor for anything else
  return Monitor;
};

const Session = () => {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) {
        setError("No user session found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiFetch(`/sessions/get-sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ sessionId: user.sessionId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch sessions");
        }

        setSessions(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id]);

  const removeAllSessions = async () => {
    setShowConfirmDialog(false);
    await logout();
  }
 
  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center gap-4 mb-6">
        {/* Wallet Icon with gradient background */}
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#9810FA] to-[#8200DB] flex items-center justify-center">
          <Clock className="w-6 h-6 text-white" />
        </div>

        {/* Title and subtitle */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-[#62748E] text-base font-normal">
            Manage your active sessions
          </p>
        </div>
      </div>

      {/* Notice */}
      <Card className="bg-[#EFF6FF] border border-[#BEDBFF] pt-[16.8px] pb-[16.8px] pr-[16.8px] pl-[16.8px] rounded-[34px] mb-6">
        <div className="flex gap-1.5 items-start">
          <div className="w-10 h-10 shrink-0 bg-[#155DFC] mt-0.5 mr-2 rounded-full flex items-center justify-center">
            {" "}
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#1C398E] font-medium text-[16px]">
              Security Notice
            </p>
            <p className=" text-[#1447E6] font-normal text-xs ">
              You can manage and terminate active sessions from any of your
              devices. If you notice any suspicious activity, log out all
              sessions immediately.
            </p>
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#9810FA]" />
        </div>
      ) : error ? (
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-600 text-center">{error}</p>
        </Card>
      ) : sessions.length === 0 ? (
        <Card className="p-6">
          <p className="text-[#62748E] text-center">No active sessions found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const DeviceIcon = getDeviceIcon(session.device, session.browser, session.os, session.userAgent);
            return (
            <Card key={session.id} className="p-6 rounded-[16px] border border-gray-200">
              <div className="flex items-start gap-4">
                {/* Device Icon */}
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#AD46FF] to-[#9810FA] flex items-center justify-center">
                  <DeviceIcon className="w-5 h-5 text-white" />
                </div>

                {/* Session Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="font-[400]  text-[#0F172B] text-[16px]">
                      {session.device || session.browser || "Unknown Device"}
                    </h3>
                    {index === 0 && (
                      <Badge className="bg-[#DCFCE7] text-[#008236] hover:bg-green-100 text-xs px-2 py-0.5">
                        Current Session
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Location */}
                    {session.location && (
                      <div className="flex items-center gap-2 text-sm text-[#62748E]">
                        <MapPin className="w-4 h-4" />
                        <span>{session.location}</span>
                      </div>
                    )}

                    {/* Logged in time */}
                    <div className="flex items-center gap-2 text-sm text-[#62748E]">
                      <Clock className="w-4 h-4" />
                      <span>
                        Logged in: {new Date(session.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>

                    {/* IP Address */}
                    {session.ipAddress && (
                      <div className="flex items-center gap-2 text-sm text-[#62748E]">
                        <Network  className="w-4 h-4" />
                        <span>IP Address: {session.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <Button 
          onClick={() => setShowConfirmDialog(true)}
          variant={'destructive'} 
          disabled={sessions.length === 0 || loading}
          className="rounded-[34px] w-full py-6 transition-all duration-300 ease-in-out hover:bg-red-500/70"
        >
          <LogOut className="mr-2" /> Logout of All Sessions
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={removeAllSessions}
        title="Logout All Sessions?"
        description="This will log you out from all devices and sessions. You will need to log in again to access your account."
        confirmText="Logout All"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Session;
