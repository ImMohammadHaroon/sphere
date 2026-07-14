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
import { invitesApi } from "@/lib/invitesApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogin } from "@/lib/authSync";
import { getDashboardPath } from "@/lib/authHelpers";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

const schema = z.object({
  name: z.string().min(2, "Your name is required"),
  password: passwordSchema,
});

export function InvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    setError("");
    try {
      const result = await invitesApi.acceptInvite({
        token,
        name: data.name,
        password: data.password,
      });
      setAccessToken(result.accessToken);
      syncLogin(result.accessToken, result.user);
      navigate(getDashboardPath(result.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite acceptance failed");
    }
  }

  return (
    <AuthLayout
      title="Join your organization"
      description="Complete your account to accept the invitation."
      footer={
        <p className="text-text-secondary">
          Wrong invite?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in instead
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" error={errors.name?.message} {...register("name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Create password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Accept invite
        </Button>
      </form>
    </AuthLayout>
  );
}
