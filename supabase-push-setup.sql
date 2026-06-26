-- =============================================
-- PUSH NOTIFICATION SETUP - Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tabel push_subscriptions
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own subscriptions" on push_subscriptions
  for all using (user_email = auth.jwt() ->> 'email');

-- 2. Tabel push_queue (untuk trigger otomatis)
create table if not exists push_queue (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  page text default 'sop',
  target_emails text[] default '{}',
  sent boolean default false,
  created_at timestamptz default now()
);

alter table push_queue enable row level security;

create policy "Service role only" on push_queue
  for all using (auth.role() = 'service_role');

-- 3. Enable pg_net extension (untuk HTTP calls dari trigger)
create extension if not exists pg_net with schema extensions;

-- 4. Trigger function: auto-push saat SOP baru ditambahkan
create or replace function notify_new_sop()
returns trigger as $$
begin
  insert into push_queue (title, body, page)
  values (
    'SOP Baru Ditambahkan',
    'Materi baru: ' || NEW.title || ' telah tersedia untuk dipelajari.',
    'sop'
  );
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_new_sop on sop_videos;
create trigger trg_notify_new_sop
  after insert on sop_videos
  for each row execute function notify_new_sop();

-- 5. Trigger function: auto-push saat sertifikat disetujui/remedial
create or replace function notify_cert_status()
returns trigger as $$
begin
  if NEW.cert_status = 'approved' and (OLD.cert_status is null or OLD.cert_status != 'approved') then
    insert into push_queue (title, body, page, target_emails)
    values (
      'Sertifikat Disetujui!',
      'Selamat! Sertifikat Anda untuk ' || coalesce(NEW.sop_title, 'materi') || ' telah disetujui.',
      'sertifikasi',
      ARRAY[NEW.user_name]
    );
  elsif NEW.cert_status = 'remedial' and (OLD.cert_status is null or OLD.cert_status != 'remedial') then
    insert into push_queue (title, body, page, target_emails)
    values (
      'Perlu Remedial',
      'Anda perlu mengulang kuis untuk ' || coalesce(NEW.sop_title, 'materi') || '.',
      'sop',
      ARRAY[NEW.user_name]
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_cert_status on quiz_submissions;
create trigger trg_notify_cert_status
  after update on quiz_submissions
  for each row execute function notify_cert_status();

-- 6. Function: process push_queue → panggil Edge Function via pg_net
-- GANTI <YOUR_SUPABASE_URL> dan <YOUR_SERVICE_ROLE_KEY> dengan nilai asli
create or replace function process_push_queue()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://vgefsqwjhyiezmlsegsf.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'title', NEW.title,
      'body', NEW.body,
      'page', NEW.page,
      'target_emails', NEW.target_emails,
      'queue_id', NEW.id
    )
  );
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_process_push_queue on push_queue;
create trigger trg_process_push_queue
  after insert on push_queue
  for each row execute function process_push_queue();
