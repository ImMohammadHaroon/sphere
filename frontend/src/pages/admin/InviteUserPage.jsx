import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { invitesApi } from "@/lib/invitesApi";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "org_admin", label: "Organization Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "team_member", label: "Team Member" },
  { value: "client", label: "Client" },
];

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["org_admin", "project_manager", "team_member", "client"]),
});

export function InviteUserPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "team_member" },
  });

  async function onSubmit(data) {
    setError("");
    setSuccess(null);

    try {
      await invitesApi.createInvite(data);
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      setSuccess({ email: data.email });
      reset({ email: "", role: "team_member" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    }
  }

  return (
    <OrgAdminLayout
      title="Invite user"
      description="Send an invitation to join your organization."
    >
      <Card className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="colleague@company.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className={cn(
                "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                errors.role?.message && "border-danger"
              )}
              {...register("role")}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role?.message ? (
              <p className="text-xs text-danger">{errors.role.message}</p>
            ) : null}
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            Send invitation
          </Button>
        </form>
      </Card>

      <Dialog
        open={Boolean(success)}
        onOpenChange={(open) => !open && setSuccess(null)}
      >
        <DialogContent onClose={() => setSuccess(null)}>
          <DialogHeader>
            <DialogTitle>Invitation sent</DialogTitle>
            <DialogDescription>
              An invitation has been sent to{" "}
              <span className="font-medium text-text-primary">
                {success?.email}
              </span>
              . They will receive an email with a link to join your
              organization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setSuccess(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OrgAdminLayout>
  );
}
