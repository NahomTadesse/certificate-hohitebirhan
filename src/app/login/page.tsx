"use client";
import Cookies from "js-cookie";
import { Eye, EyeOff, Lock, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser, forgotPassword, verifyTemporaryPassword, setNewPassword } from "@/services/authService";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const Login = () => {
  const [principal, setPrincipal] = useState(""); // Can be email or phone number
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(); 
  const router = useRouter();

  // --- Forgot password flow: request temporary password -> verify it -> set a new password ---
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgot, setForgot] = useState({ principal: "", temporaryPassword: "", newPassword: "", repeatPassword: "" });

  const openForgot = () => {
    setForgot({ principal: principal.trim(), temporaryPassword: "", newPassword: "", repeatPassword: "" });
    setForgotStep(1);
    setForgotOpen(true);
  };

  const handleForgotRequest = async () => {
    if (!forgot.principal.trim()) {
      toast.error(t("Please enter email or phone number."));
      return;
    }
    setForgotBusy(true);
    try {
      await forgotPassword(forgot.principal.trim());
      toast.success(t("A temporary password has been sent to you."));
      setForgotStep(2);
    } catch (err: any) {
      toast.error(err.message || t("Request failed"));
    } finally {
      setForgotBusy(false);
    }
  };

  const handleForgotReset = async () => {
    if (!forgot.temporaryPassword || !forgot.newPassword) {
      toast.error(t("Please fill all required fields"));
      return;
    }
    if (forgot.newPassword !== forgot.repeatPassword) {
      toast.error(t("Passwords do not match"));
      return;
    }
    setForgotBusy(true);
    try {
      const payload = { ...forgot, principal: forgot.principal.trim() };
      await verifyTemporaryPassword(payload);
      await setNewPassword(payload);
      toast.success(t("Password updated. You can now log in."));
      setForgotOpen(false);
    } catch (err: any) {
      toast.error(err.message || t("Request failed"));
    } finally {
      setForgotBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Principal value:", principal); // Debug log
    console.log("Password value:", password); // Debug log

    if (!principal || !principal.trim()) {
      setError("Please enter email or phone number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setLoading(true);

    const result = await loginUser({
      principal: principal.trim(),
      password: password,
    });

    if (result.success) {
      console.log("login success:", result.user);
      const userData = result.user;
      
      // Store user data in cookies
      Cookies.set("user_login", JSON.stringify(userData), {
        expires: 7,
        secure: true,
        sameSite: "strict",
      });

      if (userData?.role) {
        Cookies.set("user_role", userData.role, { expires: 7, secure: true, sameSite: "strict" });
      }
      if (userData?.fullName) {
        Cookies.set("user_fullName", userData.fullName, { expires: 7, secure: true, sameSite: "strict" });
      }
      if (userData?.email) {
        Cookies.set("user_email", userData.email, { expires: 7, secure: true, sameSite: "strict" });
      }
      if (userData?.phone) {
        Cookies.set("user_phone", userData.phone, { expires: 7, secure: true, sameSite: "strict" });
      }
      if (userData?.accountType) {
        Cookies.set("user_accountType", userData.accountType, { expires: 7, secure: true, sameSite: "strict" });
      }
      
      router.push("/dashboard");
    } else {
      setError(result.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl"></div>
          
          </div>
          <h1 className="text-2xl font-bold text-primary">
            Certificate-dashboard System
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("Log in to manage your operations")}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-primary">
                {t("Welcome back!")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t("Please enter your credentials")}
              </p>
            </div>

            {/* Principal Field - Accepts Email or Phone */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                type="text"
                placeholder="Email or Phone Number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl 
                         focus:ring-2 focus:ring-primary focus:border-primary 
                         text-gray-900 placeholder:text-gray-400
                         font-medium text-base transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-primary focus:border-primary 
                         text-gray-900 placeholder:text-gray-400
                         font-medium text-base transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <Label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <Checkbox disabled={loading} className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                {t("Remember me")}
              </Label>
              <button
                type="button"
                onClick={openForgot}
                className="text-secondary hover:text-secondary/80 font-medium transition"
              >
                {t("Forgot password?")}
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-semibold text-base rounded-xl shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("Logging in...")}
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </div>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("Forgot password?")}</DialogTitle>
              <DialogDescription>
                {forgotStep === 1
                  ? t("Enter your email or phone number and we will send you a temporary password.")
                  : t("Enter the temporary password you received and choose a new password.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("Email or Phone Number")}</Label>
                <Input
                  value={forgot.principal}
                  onChange={(e) => setForgot({ ...forgot, principal: e.target.value })}
                  disabled={forgotStep === 2 || forgotBusy}
                />
              </div>
              {forgotStep === 2 && (
                <>
                  <div>
                    <Label>{t("Temporary Password")}</Label>
                    <Input
                      type="password"
                      value={forgot.temporaryPassword}
                      onChange={(e) => setForgot({ ...forgot, temporaryPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("New Password")}</Label>
                    <Input
                      type="password"
                      value={forgot.newPassword}
                      onChange={(e) => setForgot({ ...forgot, newPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("Repeat Password")}</Label>
                    <Input
                      type="password"
                      value={forgot.repeatPassword}
                      onChange={(e) => setForgot({ ...forgot, repeatPassword: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotBusy}>
                {t("Cancel")}
              </Button>
              {forgotStep === 1 ? (
                <Button onClick={handleForgotRequest} disabled={forgotBusy}>
                  {forgotBusy ? t("Sending...") : t("Send temporary password")}
                </Button>
              ) : (
                <Button onClick={handleForgotReset} disabled={forgotBusy}>
                  {forgotBusy ? t("Saving...") : t("Reset password")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <p className="mt-8 text-xs text-center text-gray-400 font-medium">
          © {new Date().getFullYear()} {t("Certificate-dashboard System. Powered by Certeficate-dashboard.")}
        </p>
      </div>
    </div>
  );
};

export default Login;