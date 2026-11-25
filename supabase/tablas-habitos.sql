-- MyGoodHabits: tablas para guardar los hábitos de cada usuario.
-- Se corre una sola vez en Supabase > SQL Editor.

-- Un renglón por usuario por día (sueño, agua, ejercicio, hábitos, ánimo, nota).
create table if not exists public.dias (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (user_id, fecha),
  -- Un día normal pesa menos de 2 KB. Si alguien manda algo gigante para llenar la base, se rechaza.
  constraint dias_tamano check (pg_column_size(datos) < 20000)
);

-- Un renglón por usuario con sus metas y su lista de hábitos.
create table if not exists public.configuracion (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  constraint configuracion_tamano check (pg_column_size(datos) < 20000)
);

-- RLS: sin esto, cualquiera con la llave pública (que está en el index.html) podría leer los hábitos de todos.
alter table public.dias enable row level security;
alter table public.configuracion enable row level security;

-- Cada usuario solo puede ver, crear, cambiar y borrar sus propios renglones.
-- (select auth.uid()) en vez de auth.uid() es lo que recomienda Supabase para que no se haga lento con muchos renglones.
create policy "dias: solo el dueño" on public.dias
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "configuracion: solo el dueño" on public.configuracion
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
