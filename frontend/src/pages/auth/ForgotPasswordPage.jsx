import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { authApi } from "@/lib/authApi";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devToken, setDevToken] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    setError("");
    setSuccess("");
    setDevToken("");
    try {
      const result = await authApi.forgotPassword(data.email);
      setSuccess(result.message);
      if (result.resetToken) {
        setDevToken(result.resetToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="We'll send a reset link if an account exists for that email."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {success ? <Alert variant="success">{success}</Alert> : null}
        {devToken ? (
          <Alert variant="info">
            Development reset token:{" "}
            <Link
              to={`/reset-password/${devToken}`}
              className="font-mono underline"
            >
              use this link
            </Link>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
