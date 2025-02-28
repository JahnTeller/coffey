"use server";
import { Tables } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: drinks, error: errormassagdrink } = await supabase
    .from("drink")
    .select("*")
    .returns<[Tables<"drink">]>();

  if (errormassagdrink) {
    return new Response(JSON.stringify({ error: errormassagdrink.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(drinks), { status: 200 });
}
