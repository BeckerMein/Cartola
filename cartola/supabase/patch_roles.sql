-- Admin role support (optional, MVP+)  
alter table public.profiles add column if not exists role text not null default 'user';  
alter table public.profiles add constraint profiles_role_check check (role in ('user','admin'));  
  
-- Example: promote a user by id in SQL Editor  
-- update public.profiles set role = 'admin' where id = 'USER_UUID'; 
