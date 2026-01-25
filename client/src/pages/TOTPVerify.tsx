import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { apiJson, jsonHeaders } from "@/lib/api";
import { updateSessionMetadata } from "@/lib/updateSessionMetadata";

const formSchema = z.object({
  totp: z.string().length(6, "TOTP must be 6 digits"),
});

const TOTPVerify = () => {
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState<string>("");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totp: "",
    },
  });
  const queryParams = useSearchParams()[0];
  const location = useLocation();
  const navigate = useNavigate();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  useEffect(() => {
    async function fetchAndSetParams() {
      setLoading(true);
      const stateToken = (location.state as any)?.tempToken as
        | string
        | undefined;
      const queryToken = queryParams.get("tempToken") || "";
      setTempToken(stateToken || queryToken);
    }
    fetchAndSetParams().finally(() => {
      setLoading(false);
    });
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const { response, data: decoded } = await apiJson<any>(
        "/sentinel/verify-wl-totp",
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            totp: values.totp,
            tempToken,
          }),
        },
      );

      if (response.status === 400) {
        toast.error(decoded.message || "Invalid TOTP. Please try again.");
      } else if (response.status === 200) {
        setAuthenticated({
          id: decoded.userId,
          isAdmin: Boolean(decoded.isAdmin),
        });

        toast.success("Verified successfully");
        // send session metadata in background
        updateSessionMetadata(decoded.sessionId);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error while validating TOTP", error);
      toast.error(`Error validating TOTP. Please try again after sometime`);
    } finally {
      setLoading(false);
    }
  }

  if (!tempToken) {
    return (
      <div className="min-h-screen flex flex-col gap-3 flex-1 justify-center items-center">
        <p className="text-gray-500 text-lg">
          Invalid verification session. Please login again.
        </p>
        <Button className="ml-4">
          <Link to="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-1 justify-center items-center">
      <Card className="w-111.75 h-166.25">
        <CardContent className="py-8 relative">
          <div>
            <Link to="/login">
              <Button
                variant="ghost"
                className="absolute top-1 left-5 rounded-full p-2"
              >
                <ArrowRight className="rotate-180" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col justify-center items-center">
            {/* Login Logo */}
            <img src="LoginScreen-Logo.png" alt="Mobitech Logo" />
            {/* Welcome Text */}
            <div className="flex flex-col items-center gap-1 text-center mt-3">
              <div className="w-16 h-16 flex items-center justify-center rounded-3xl bg-linear-to-r from-[#296CFF] to-[#155DFC]">
                <Shield className="text-white" size={33} />
              </div>
              <h2 className="text-lg font-semibold mt-6">
                Enter Verification Code
              </h2>
              <p className="text-[#45556C] text-sm px-16 mt-1 ">
                Enter the 6-digit code generated from your authenticator app
              </p>
            </div>
          </div>

          <div className="mt-16 px-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-7"
              >
                <FormField
                  control={form.control}
                  name="totp"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          {...field}
                          containerClassName="flex justify-center w-full"
                        >
                          <InputOTPGroup className="gap-4">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className="w-11 h-14 rounded-[40px]! border-[1.6px] border-gray-300 text-lg font-semibold transition-all duration-200 ease-in-out data-[active=true]:border-[#296CFF] data-[active=true]:ring-2 data-[active=true]:ring-[#296CFF]/30 data-[active=true]:scale-105 hover:border-[#296CFF]/50 focus:outline-none first:rounded-[40px]! last:rounded-[40px]! border-l"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  variant={"custom-one"}
                  size="custom-small"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 h-12"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {loading ? (
                      <motion.span
                        key="verifying"
                        className="inline-flex items-center justify-center"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        Verifying...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="verify"
                        className="inline-flex items-center gap-1 justify-center"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        Verify & Continue <ArrowRight size={17} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TOTPVerify;
