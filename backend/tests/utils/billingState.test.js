import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertBillingAllowsActions, getOrgBillingState } from "../../src/utils/billingState.js";

describe("billingState", () => {
  it("getOrgBillingState computes trial days remaining", () => {
    const trialEndsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const org = {
      billing: {
        plan: "starter",
        interval: "month",
        status: "trialing",
        trialEndsAt,
        cancelAtPeriodEnd: false,
        defaultPaymentMethodId: null,
      },
    };

    const state = getOrgBillingState(org);
    assert.equal(state.plan, "starter");
    assert.equal(state.status, "trialing");
    assert.ok(state.daysLeftInTrial <= 2);
    assert.equal(state.hasPaymentMethod, false);
  });

  it("assertBillingAllowsActions blocks canceled subscriptions", () => {
    assert.throws(
      () =>
        assertBillingAllowsActions({
          billing: { status: "canceled" },
        }),
      (err) => err.status === 402
    );
  });

  it("assertBillingAllowsActions blocks past_due subscriptions", () => {
    assert.throws(
      () =>
        assertBillingAllowsActions({
          billing: { status: "past_due" },
        }),
      (err) => err.status === 402
    );
  });
});
