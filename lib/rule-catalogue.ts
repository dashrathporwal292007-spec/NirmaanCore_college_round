export interface RuleExplanation {
  trigger: string;
  action: string;
  why: string;
  source: string;
}
export const ruleCatalogue: Record<string, RuleExplanation> = {
  REMINDER_REQUIRES_UNREGISTERED: {
    trigger:
      "A contact has registered for the webinar linked to a queued reminder.",
    action:
      "Cancel the still-queued reminder. If already sent, record that it is too late to recall it.",
    why: "A registered person no longer needs an invitation to register.",
    source: "lib/rules/evaluate.ts; docs/BLUEPRINT.md §2.5",
  },
  OPTED_OUT_BLOCKS_PROMO: {
    trigger:
      "A contact has opted out. Consent is checked before every other dispatch rule.",
    action:
      "Withdraw unapproved drafts and cancel queued promotional messages. Preserve sent history.",
    why: "An opt-out must stop future promotion even if it was scheduled earlier.",
    source:
      "lib/rules/evaluate.ts; lib/services/adaptive.ts; docs/BLUEPRINT.md §2.5",
  },
  PROMO_REQUIRES_NOT_SUBSCRIBED: {
    trigger:
      "An active subscription exists when an offer is checked, or a simulated checkout activates one.",
    action: "Cancel queued offers and withdraw unapproved offer drafts.",
    why: "Do not keep offering a subscription to someone who already subscribed.",
    source:
      "lib/rules/evaluate.ts; lib/services/adaptive.ts; docs/BLUEPRINT.md §2.5",
  },
  ATTENDED_PREPARES_OFFER: {
    trigger:
      "A webinar is closed and its registration records show attendance; the contact is eligible and has no active subscription.",
    action:
      "Draft an offer for owner approval. It does not send or charge money.",
    why: "Attendance makes an offer relevant, but a person must approve it.",
    source: "lib/services/adaptive.ts; docs/BLUEPRINT.md §2.5",
  },
  MISSED_PREPARES_FOLLOWUP: {
    trigger:
      "A webinar is closed and an eligible registered contact has not attended.",
    action:
      "Draft a follow-up for owner approval. Nothing is sent until approval.",
    why: "A no-show needs a different message from an attendee.",
    source: "lib/services/adaptive.ts; docs/BLUEPRINT.md §2.5",
  },
  CANCELLED_BY_USER: {
    trigger: "An authorised person cancels pending messages for a run.",
    action:
      "Cancel still-queued messages from that run; report already-sent messages separately.",
    why: "A person can stop pending work without deleting registrations, subscriptions or history.",
    source: "lib/services/cancel_pending.ts",
  },
  RUN_REWOUND: {
    trigger: "An authorised person confirms whole-run rewind.",
    action:
      "Compensate reversible steps, cancel queued campaign messages and report effects that cannot be recalled.",
    why: "Undo only what can actually be reversed. This is a user action, not an adaptive trigger.",
    source: "lib/agent/runner.ts; lib/tools/campaigns.ts",
  },
};
