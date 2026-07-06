import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { authApi } from "@/lib/authApi";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

const schema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  password: passwordSchema,
});

export function RegisterPage() {
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
      await authApi.registerOrg(data);
      navigate("/register/verify", {
        state: { email: data.email.trim().toLowerCase() },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <AuthSplitLayout
      title="Create your organization"
      description="Register your company and become the first Org Admin."
      footer={
        <p className="text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="orgName">Organization name</Label>
          <Input
            id="orgName"
            error={errors.orgName?.message}
            {...register("orgName")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" error={errors.name?.message} {...register("name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Continue
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
