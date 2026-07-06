import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

const schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function ResetPasswordPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    setError("");
    try {
      await authApi.resetPassword({
        token,
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      description="Use a strong password you have not used elsewhere."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>

      <Dialog
        open={success}
        onOpenChange={(open) => {
          if (!open) {
            setSuccess(false);
            navigate("/login");
          }
        }}
      >
        <DialogContent
          onClose={() => {
            setSuccess(false);
            navigate("/login");
          }}
        >
          <DialogHeader>
            <DialogTitle>Password updated</DialogTitle>
            <DialogDescription>
              Your password has been reset successfully. You can now sign in with
              your new password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setSuccess(false);
                navigate("/login");
              }}
            >
              Sign in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
