-- Relationship between the signed-in member and another profile, for profile
-- pages ("Follow" / "Following" / "Follows you" / "Blocked" / "You're blocked").
-- Members can't read other people's block rows, so this definer function
-- returns only booleans about the caller's own relationships.

create function public.viewer_relationship(p_profile_id uuid)
returns table (following boolean, followed_by boolean, blocked boolean, blocked_by boolean)
language sql stable security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.follows
            where follower_id = (select auth.uid()) and followee_id = p_profile_id),
    exists (select 1 from public.follows
            where follower_id = p_profile_id and followee_id = (select auth.uid())),
    exists (select 1 from public.blocks
            where blocker_id = (select auth.uid()) and blocked_id = p_profile_id),
    exists (select 1 from public.blocks
            where blocker_id = p_profile_id and blocked_id = (select auth.uid()));
$$;

revoke execute on function public.viewer_relationship(uuid) from public, anon;
grant execute on function public.viewer_relationship(uuid) to authenticated;
