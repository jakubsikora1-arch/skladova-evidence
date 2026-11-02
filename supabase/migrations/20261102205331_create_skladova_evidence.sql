create table public.skladova_evidence (
 id smallint primary key default 1 check (id = 1),
 items jsonb not null,
 updated_at timestamptz not null default now(),
 constraint skladova_evidence_items_array check (jsonb_typeof(items) = 'array')
);
alter table public.skladova_evidence enable row level security;
revoke all on table public.skladova_evidence from anon, authenticated;
grant all on table public.skladova_evidence to service_role;
