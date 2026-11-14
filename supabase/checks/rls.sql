-- Security check: every table in the public schema must have row-level security
-- enabled AND at least one policy. Any row returned here is a problem.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count,
  case
    when not c.relrowsecurity then 'CRITICAL: RLS disabled, anyone with the public key can read/write this table'
    when count(p.policyname) = 0 then 'WARNING: RLS on but no policies, table is locked to everyone (may be intended)'
  end as issue
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
having not c.relrowsecurity or count(p.policyname) = 0
order by c.relrowsecurity, c.relname;

-- Policies that allow everything (review each one):
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and (qual = 'true' or with_check = 'true');
