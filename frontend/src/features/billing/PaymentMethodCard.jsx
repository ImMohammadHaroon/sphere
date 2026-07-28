import { useState, useImperativeHandle, forwardRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, ShieldCheck, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  useCreateSetupIntent,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
} from "./hooks/useBilling";
import { toast } from "@/lib/toast";
import * as billingApi from "@/lib/billingApi";
import { cn } from "@/lib/utils";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatExpiry(expMonth, expYear) {
  if (!expMonth || !expYear) return "";
  return `${String(expMonth).padStart(2, "0")}/${String(expYear).slice(-2)}`;
}

function PaymentMethodForm({ onSuccess, onCancel, hasExistingCards }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [useForNextPayment, setUseForNextPayment] = useState(
    !hasExistingCards
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage("");

    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setIsSubmitting(false);
      setErrorMessage(result.error.message ?? "Failed to save card");
      return;
    }

    try {
      if (result.setupIntent?.id) {
        await billingApi.confirmPaymentMethod({
          setupIntentId: result.setupIntent.id,
          setAsDefault: hasExistingCards ? useForNextPayment : true,
        });
      }
      toast.success("Card added successfully");
      onSuccess?.();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save payment method"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {hasExistingCards ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface/50 p-3">
          <input
            type="checkbox"
            checked={useForNextPayment}
            onChange={(event) => setUseForNextPayment(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>
            <span className="block text-sm font-medium text-text-primary">
              Set as primary card
            </span>
            <span className="mt-0.5 block text-sm text-text-secondary">
              Primary cards are charged first. Other cards are used if payment
              fails.
            </span>
          </span>
        </label>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-danger">{errorMessage}</p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!stripe}>
          Save card
        </Button>
      </DialogFooter>
    </form>
  );
}

function SavedCardRow({
  method,
  onSetDefault,
  onRemove,
  isSettingDefault,
  isRemoving,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        method.isDefault
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-text-primary">
              {capitalize(method.brand)} ···· {method.last4}
            </p>
            {method.isDefault ? (
              <Badge variant="success">Primary card</Badge>
            ) : (
              <Badge variant="muted">Backup</Badge>
            )}
          </div>
          <p className="text-sm text-text-muted">
            Expires {formatExpiry(method.expMonth, method.expYear)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!method.isDefault ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSetDefault(method.id)}
            isLoading={isSettingDefault}
          >
            <Star className="h-4 w-4" />
            Set as primary
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-text-muted hover:text-danger"
          onClick={() => onRemove(method)}
          isLoading={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

export const PaymentMethodCard = forwardRef(function PaymentMethodCard(
  { billing, paymentMethods = [], onUpdated },
  ref
) {
  const [open, setOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [setupError, setSetupError] = useState("");
  const [cardToRemove, setCardToRemove] = useState(null);
  const createSetupIntent = useCreateSetupIntent();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();
  const isStripeConfigured = Boolean(publishableKey);

  const hasCards = paymentMethods.length > 0;

  async function handleOpen() {
    setSetupError("");

    if (!isStripeConfigured) {
      const message =
        "Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to frontend/.env and restart the dev server.";
      setSetupError(message);
      toast.error(message);
      return;
    }

    try {
      const data = await createSetupIntent.mutateAsync();
      if (!data?.clientSecret) {
        throw new Error("Stripe did not return a setup session");
      }
      setClientSecret(data.clientSecret);
      setOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start card setup";
      setSetupError(message);
      toast.error(message);
    }
  }

  useImperativeHandle(ref, () => ({
    openDialog: handleOpen,
  }));

  function handleClose() {
    setOpen(false);
    setClientSecret("");
  }

  function handleDialogChange(nextOpen) {
    if (!nextOpen) {
      handleClose();
      return;
    }
    setOpen(true);
  }

  function handleSuccess() {
    handleClose();
    setSetupError("");
    onUpdated?.();
  }

  async function handleSetDefault(paymentMethodId) {
    await setDefaultPaymentMethod.mutateAsync(paymentMethodId);
    onUpdated?.();
  }

  async function handleConfirmRemove() {
    if (!cardToRemove) return;
    await removePaymentMethod.mutateAsync(cardToRemove.id);
    setCardToRemove(null);
    onUpdated?.();
  }

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Payment methods
          </div>
          <Button
            type="button"
            variant={hasCards ? "outline" : "primary"}
            size="sm"
            onClick={handleOpen}
            isLoading={createSetupIntent.isPending}
            disabled={!isStripeConfigured}
          >
            Add card
          </Button>
        </div>

        <p className="mt-2 text-sm text-text-secondary">
          Your primary card is charged first. If it&apos;s declined or has
          insufficient funds, we automatically try your other saved cards.
        </p>

        {hasCards ? (
          <div className="mt-4 space-y-3">
            {paymentMethods.map((method) => (
              <SavedCardRow
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onRemove={setCardToRemove}
                isSettingDefault={
                  setDefaultPaymentMethod.isPending &&
                  setDefaultPaymentMethod.variables === method.id
                }
                isRemoving={
                  removePaymentMethod.isPending &&
                  removePaymentMethod.variables === method.id
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 font-medium text-text-primary">No cards saved</p>
            <p className="mt-1 text-sm text-text-secondary">
              Add a card before your trial ends. You won&apos;t be charged until
              billing starts.
            </p>
          </div>
        )}

        {!isStripeConfigured ? (
          <Alert variant="error" className="mt-4">
            Add <code className="text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> to{" "}
            <code className="text-xs">frontend/.env</code> and restart the dev server.
          </Alert>
        ) : null}

        {setupError ? (
          <Alert variant="error" className="mt-4">
            {setupError}
          </Alert>
        ) : null}
      </Card>

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent onClose={handleClose}>
          <DialogHeader>
            <DialogTitle>Add card</DialogTitle>
            <DialogDescription>
              Cards are saved securely with Stripe. Set one as primary for
              billing — backup cards are used automatically if the primary
              payment fails.
            </DialogDescription>
          </DialogHeader>

          {clientSecret && stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#1f6b4f" },
                },
              }}
            >
              <PaymentMethodForm
                onSuccess={handleSuccess}
                onCancel={handleClose}
                hasExistingCards={hasCards}
              />
            </Elements>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(cardToRemove)}
        onOpenChange={(open) => {
          if (!open) setCardToRemove(null);
        }}
        title="Remove card?"
        description={
          cardToRemove
            ? `Remove ${capitalize(cardToRemove.brand)} ending in ${cardToRemove.last4}?${
                cardToRemove.isDefault && paymentMethods.length > 1
                  ? " Another saved card will be used for your next payment."
                  : cardToRemove.isDefault
                    ? " You won't have a card on file for upcoming charges."
                    : ""
              }`
            : ""
        }
        confirmLabel="Remove card"
        variant="danger"
        onConfirm={handleConfirmRemove}
        isLoading={removePaymentMethod.isPending}
      />
    </>
  );
});
