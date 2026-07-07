import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogin } from "@/lib/authSync";
import { getPostAuthPath } from "@/lib/authHelpers";

const RESEND_COOLDOWN_SEC = 60;

export function VerifyOrgRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerify(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await authApi.verifyOrgRegistration({ email, code });
      setAccessToken(result.accessToken);
      syncLogin(result.accessToken, result.user);
      navigate(getPostAuthPath(result.user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;

    setError("");
    setInfo("");
    setIsResending(true);

    try {
      await authApi.resendOrgVerification(email);
      setInfo("A new verification code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN_SEC);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setIsResending(false);
    }
  }

  if (!email) {
    return null;
  }

  return (
    <AuthSplitLayout
      title="Verify your email"
      description="Enter the 6-digit code we sent to your inbox to finish creating your organization."
      footer={
        <p className="text-text-secondary">
          Wrong email?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Start over
          </Link>
        </p>
      }
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} disabled readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center font-mono text-lg tracking-[0.4em]"
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isVerifying}>
          Verify and continue
        </Button>

        <div className="text-center text-sm text-text-secondary">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            {isResending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
