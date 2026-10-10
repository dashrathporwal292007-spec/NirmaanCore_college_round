-- docs/schema_adaptive.sql
alter table campaigns add column kind text not null default 'invite'
  check (kind in ('invite','reminder','followup','offer'));

-- four honest message states: queued, sent (simulated delivery), cancelled, failed
alter table outbox drop constraint outbox_status_check;   -- if this name differs, check \d outbox
alter table outbox add constraint outbox_status_check
  check (status in ('queued','sent','cancelled','failed'));
alter table outbox add column cancel_reason jsonb;        -- the rule decision that cancelled it
alter table outbox add column dispatched_at timestamptz;
create index outbox_due on outbox (dispatch_after) where status = 'queued';
create index outbox_queued_by_contact on outbox (contact_id) where status = 'queued';

-- a repeated checkout cannot bill twice
alter table invoices add constraint invoices_once_per_period unique (subscription_id, period);

-- drafts the automation prepares; nothing here sends anything until an owner approves
create table pending_actions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('offer','followup')),
  contact_id uuid not null references contacts(id) on delete cascade,
  webinar_id uuid not null references webinars(id) on delete cascade,
  rule_id text not null,
  evidence jsonb not null default '{}',
  status text not null default 'awaiting_approval'
    check (status in ('awaiting_approval','approved','withdrawn')),
  created_at timestamptz not null default now(),
  unique (kind, contact_id, webinar_id)      -- End webinar pressed twice drafts nothing new
);
