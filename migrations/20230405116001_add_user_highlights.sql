create table public.user_highlights
(
  -- static columns
  id bigint not null generated by default as identity ( increment 1 start 1 minvalue 1 maxvalue 9223372036854775807 cache 1 ),
  user_id bigint null references public.users (id) on delete cascade on update cascade,
  pinned boolean not null default false,
  created_at timestamp without time zone default now() not null,
  updated_at timestamp without time zone default now() not null,
  deleted_at timestamp without time zone default null,
  shipped_at timestamp without time zone default null,

  -- elastic columns
  title character varying(100) collate pg_catalog."default" not null default '',
  url character varying(255) collate pg_catalog."default" not null default '',
  highlight character varying(500) collate pg_catalog."default" not null,

  -- dynamic columns
  constraint user_highlights_pkey primary key (id)
)

tablespace pg_default;

-- indexes
create index user_highlights_idx_pinned on public.user_highlights (pinned);
create index user_highlights_idx_created_at on public.user_highlights (created_at);
create index user_highlights_idx_updated_at on public.user_highlights (updated_at);
create index user_highlights_idx_deleted_at on public.user_highlights (deleted_at);
create index user_highlights_idx_shipped_at on public.user_highlights (shipped_at);
create index user_highlights_idx_title on public.user_highlights (title);
