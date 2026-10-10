create extension if not exists pgcrypto;
create type role_t as enum ('owner','marketer','viewer');

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null unique, role role_t not null
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, phone text,
  tags text[] not null default '{}',
  source text,
  status text not null default 'new' check (status in ('new','engaged','registered','customer')),
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index contacts_email_uq on contacts (lower(email));
create index contacts_tags_gin on contacts using gin (tags);

create table contact_events (
  id bigserial primary key,
  contact_id uuid not null references contacts(id) on delete cascade,
  type text not null, payload jsonb not null default '{}',
  run_id uuid,                       -- no FK on purpose (see above)
  created_at timestamptz not null default now()
);
create index contact_events_by_contact on contact_events (contact_id, created_at desc);

create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, title text not null,
  blocks jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  version int not null default 1
);

create table webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  starts_at timestamptz not null, join_url text not null,
  page_id uuid references pages(id),
  status text not null default 'scheduled' check (status in ('scheduled','archived','done'))
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references webinars(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  attended boolean not null default false,
  registered_at timestamptz not null default now(),
  unique (webinar_id, contact_id)
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null, segment jsonb not null default '{}',
  subject text not null, body text not null,
  webinar_id uuid references webinars(id),
  status text not null default 'draft' check (status in ('draft','scheduled','cancelled','sent')),
  scheduled_at timestamptz
);

create table outbox (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  payload jsonb not null default '{}',
  dispatch_after timestamptz not null,
  status text not null default 'queued' check (status in ('queued','sent','cancelled')),
  unique (campaign_id, contact_id)
);

create table engagement (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references outbox(id) on delete cascade,
  opened boolean not null default false, clicked boolean not null default false
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('flat','usage')),
  price_inr int not null default 0,          -- flat price per month
  unit_price_inr int not null default 0,     -- per unit for usage plans (assumption)
  included_units int not null default 0
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status text not null default 'offered' check (status in ('offered','active','cancelled')),
  started_at timestamptz,
  unique (contact_id, plan_id)
);

create table usage_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  units int not null, recorded_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount_inr int not null, status text not null default 'draft', period text
);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  instruction text not null,
  plan jsonb, diff jsonb, risk text, plan_hash text,
  required_role role_t,
  status text not null default 'drafted' check (status in
    ('drafted','awaiting_approval','approved','completed','failed','rewound','rejected','refused')),
  error text,
  created_at timestamptz not null default now(), completed_at timestamptz
);

create table run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  seq int not null, tool text not null, args jsonb, result jsonb, compensation jsonb,
  status text not null default 'done' check (status in ('done','rewound','cannot_rewind')),
  idempotency_key text not null unique,      -- run_id:seq
  unique (run_id, seq)
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  required_role role_t not null,
  requested_by uuid not null references users(id),
  decided_by uuid references users(id),
  decision text check (decision in ('approved','rejected')),
  decided_at timestamptz
);

create table audit_log (
  id bigserial primary key,
  actor text not null, run_id uuid, action text not null, entity text,
  before jsonb, after jsonb, at timestamptz not null default now()
);
