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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { authApi } from "@/lib/authApi";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    setError("");
    setSuccessEmail("");

    try {
      await authApi.forgotPassword(data.email);
      setSuccessEmail(data.email);
      reset({ email: "" });
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

      <Dialog
        open={Boolean(successEmail)}
        onOpenChange={(open) => !open && setSuccessEmail("")}
      >
        <DialogContent onClose={() => setSuccessEmail("")}>
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
            <DialogDescription>
              If an account exists for{" "}
              <span className="font-medium text-text-primary">
                {successEmail}
              </span>
              , we&apos;ve sent a password reset link. Please check your inbox
              and follow the instructions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setSuccessEmail("")}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
