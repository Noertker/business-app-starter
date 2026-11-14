-- Abuse protection: cap how many customers one account can create, enforced by
-- the database itself so it also applies to requests that skip the app.
-- ✏️ Raise the limit if your business needs more (or tie it to the user's plan).

create or replace function public.enforce_customer_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.customers where owner_id = new.owner_id) >= 1000 then
    raise exception 'Customer limit reached (1000 per account)' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_customer_limit() from public, anon, authenticated;

create trigger customers_limit
  before insert on public.customers
  for each row execute function public.enforce_customer_limit();
