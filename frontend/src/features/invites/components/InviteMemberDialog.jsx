import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { ApiError } from "@/lib/apiClient";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "org_admin", label: "Organization Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "team_member", label: "Team Member" },
  { value: "client", label: "Client" },
];

function parseEmails(raw) {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

const emailSchema = z.string().email();

const schema = z.object({
  emails: z
    .string()
    .min(1, "Enter at least one email address")
    .superRefine((value, ctx) => {
      const emails = parseEmails(value);
      if (emails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter at least one email address",
        });
        return;
      }

      for (const email of emails) {
        if (!emailSchema.safeParse(email).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid email address: ${email}`,
          });
          return;
        }
      }
    }),
  role: z.enum(["org_admin", "project_manager", "team_member", "client"]),
});

export function InviteMemberDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "team_member", emails: "" },
  });

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setError("");
      setResult(null);
      reset({ emails: "", role: "team_member" });
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(data) {
    setError("");
    const emails = parseEmails(data.emails);

    const outcomes = await Promise.allSettled(
      emails.map((email) =>
        invitesApi.createInvite({ email, role: data.role })
      )
    );

    const sent = [];
    const failed = [];

    outcomes.forEach((outcome, index) => {
      const email = emails[index];
      if (outcome.status === "fulfilled") {
        sent.push(email);
      } else {
        const message =
          outcome.reason instanceof ApiError
            ? outcome.reason.message
            : "Failed to send invite";
        failed.push({ email, message });
      }
    });

    if (sent.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      toast.success(
        sent.length === 1
          ? `Invitation sent to ${sent[0]}`
          : `${sent.length} invitations sent`
      );
    }

    if (failed.length === 0) {
      setResult({ sent, failed });
      reset({ emails: "", role: data.role });
      return;
    }

    if (sent.length === 0) {
      setError(
        failed.length === 1
          ? failed[0].message
          : failed.map((item) => `${item.email}: ${item.message}`).join(" · ")
      );
      return;
    }

    setResult({ sent, failed });
    reset({ emails: "", role: data.role });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {result.failed.length === 0
                  ? result.sent.length === 1
                    ? "Invitation sent"
                    : "Invitations sent"
                  : "Invitations partially sent"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-text-secondary">
              {result.sent.length > 0 ? (
                <div>
                  <p>
                    {result.sent.length === 1
                      ? "An invitation has been sent to:"
                      : `Invitations have been sent to ${result.sent.length} people:`}
                  </p>
                  <ul className="mt-2 list-inside list-disc text-text-primary">
                    {result.sent.map((email) => (
                      <li key={email} className="font-medium">
                        {email}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.failed.length > 0 ? (
                <div>
                  <p>
                    {result.failed.length === 1
                      ? "Could not send an invitation to:"
                      : `Could not send ${result.failed.length} invitations:`}
                  </p>
                  <ul className="mt-2 space-y-1 text-text-primary">
                    {result.failed.map((item) => (
                      <li key={item.email}>
                        <span className="font-medium">{item.email}</span>
                        <span className="text-text-muted">
                          {" "}
                          — {item.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>
                  They will receive an email with a link to join your
                  organization.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite members</DialogTitle>
              <DialogDescription>
                Send invitations to join your organization. You can enter
                multiple email addresses at once.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error ? <Alert variant="error">{error}</Alert> : null}

              <div className="space-y-2">
                <Label htmlFor="invite-emails">Email addresses</Label>
                <textarea
                  id="invite-emails"
                  rows={4}
                  autoComplete="email"
                  placeholder="colleague@company.com, teammate@company.com"
                  className={cn(
                    "flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                    errors.emails?.message && "border-danger"
                  )}
                  {...register("emails")}
                />
                {errors.emails?.message ? (
                  <p className="text-xs text-danger">{errors.emails.message}</p>
                ) : (
                  <p className="text-xs text-text-muted">
                    Separate multiple addresses with commas, spaces, or new
                    lines.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Send invitations
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
