import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { apiJson, jsonHeaders } from "@/lib/api";
const formSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6).max(50),
});
const Login = () => {
  type LoginFormValues = z.infer<typeof formSchema>;

  const form = useForm<LoginFormValues, any, LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const route = useNavigate();
  async function onSubmit(values: LoginFormValues) {
    // console.log(values);
    setLoading(true);
    try {
      const { response, data: decoded } = await apiJson<any>(
        "/sentinel/web-lint",
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            phone: values.phone,
            password: values.password,
          }),
        },
      );

      if (response.status === 400) {
        toast.error(decoded.message || "Please try again later.");
      } else if (response.status === 200) {
        if (decoded.status === "MFA_NOT_ENABLED") {
          toast.success("Please enable MFA to proceed.");
          route(`/mfa-setup?uid=${decoded.user.id}`);
        }
        if (decoded.status === "TOTP_REQUIRED") {
          toast.success("Login successful. Please verify TOTP.");
          route(`/totp-verify`, {
            state: { tempToken: decoded.tempToken, from: "web-lint" },
          });
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Login failed. Please try again.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
  }
  return (
    <div className="min-h-screen flex flex-1 justify-center items-center">
      <Card className="w-111.75 h-166.25">
        <CardContent className="py-8">
          <div className="flex flex-col justify-center items-center">
            {/* Login Logo */}
            <img src="LoginScreen-Logo.png" alt="Mobitech Logo" />
            {/* Welcome Text */}
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-2xl font-bold mt-3">Welcome Back!</h1>
              <p className="text-[#45556C] ">Sign in to Mobitech CRM</p>
            </div>
          </div>

          <div className="mt-10 px-2">
            {/* Login Form - To be implemented */}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  // Show toast for validation errors
                  if (errors.phone) {
                    toast.error("Invalid phone number");
                  }
                  if (errors.password) {
                    toast.error("Invalid password");
                  }
                })}
                className="space-y-7"
              >
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                            <span className="inline-flex items-center gap-2 rounded-md border border-input bg-muted/60 px-2 py-1 text-sm text-foreground/80 shadow-sm">
                              <img
                                src="indian-flag.png"
                                alt="India Flag"
                                className="w-4 h-4"
                              />{" "}
                              +91
                            </span>
                          </div>

                          <Input
                            placeholder="Enter your phone number"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="tel-national"
                            maxLength={10}
                            disabled={loading}
                            {...field}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(
                                /\D/g,
                                "",
                              );
                              field.onChange(digitsOnly);
                            }}
                            className="py-5.5 pl-21 pr-4 focus-visible:ring-[#1e64fe]/30 focus-visible:border-[#1e64fe]"
                          />
                        </div>
                      </FormControl>

                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your password"
                            {...field}
                            disabled={loading}
                            type={showPassword ? "text" : "password"}
                            className="py-5.5 px-4 focus-within:ring-2 focus-within:ring-[#1e64fe] focus-within:shadow-[0_0_0_3px_rgba(30,100,254,0.1)] outline-none"
                          />
                          <div
                            className="absolute right-4  -translate-y-2 top-1/2  cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <Eye className="text-[#62748E]" size={17} />
                            ) : (
                              <EyeOff className="text-[#62748E]" size={17} />
                            )}
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className=" flex flex-col gap-5">
                  <Link
                    to="/forgot-password"
                    className="text-sm flex items-center gap-1 text-[#1e64fe] hover:underline"
                  >
                    Forgot Password? <ArrowRight size={17} />
                  </Link>
                  <Button
                    variant={"custom-one"}
                    size="custom-small"
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {loading ? (
                        <motion.span
                          key="signin-loading"
                          className="inline-flex items-center justify-center"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          Signing in...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="signin-idle"
                          className="inline-flex items-center gap-1 justify-center"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          Sign In <ArrowRight size={17} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
