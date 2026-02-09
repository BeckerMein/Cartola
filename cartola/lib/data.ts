import { supabase } from "@/lib/supabase";

export type Team = {
  id: string;
  owner_id: string;
  name: string;
  balance: number | null;
};

export type Round = {
  id: number;
  is_open: boolean;
};

export type Athlete = {
  id: number;
  name: string;
  nickname: string | null;
  position_id: number | null;
  club_id: number | null;
  price: number | null;
};

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getTeamForUser(userId: string): Promise<Team | null> {
  const { data } = await supabase.from("teams").select("id,owner_id,name,balance").eq("owner_id", userId).maybeSingle();
  return data ?? null;
}

export async function getOpenRound(): Promise<Round | null> {
  const { data } = await supabase
    .from("rounds")
    .select("id,is_open")
    .eq("is_open", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function fetchAthletes(): Promise<Athlete[]> {
  const { data } = await supabase
    .from("athletes")
    .select("id,name,nickname,position_id,club_id,price")
    .order("name", { ascending: true });
  return data ?? [];
}

export async function fetchMarketAthletes(roundId: number): Promise<Athlete[]> {
  const { data } = await supabase
    .from("market")
    .select("price,athletes(id,name,nickname,position_id,club_id,price)")
    .eq("round_id", roundId);

  if (!data) return [];

  return data
    .map((row: any) => {
      const athlete = row.athletes;
      if (!athlete) return null;
      return {
        id: athlete.id,
        name: athlete.name,
        nickname: athlete.nickname,
        position_id: athlete.position_id,
        club_id: athlete.club_id,
        price: row.price ?? athlete.price,
      } as Athlete;
    })
    .filter(Boolean) as Athlete[];
}
