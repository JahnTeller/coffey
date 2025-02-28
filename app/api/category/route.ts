"use server";
import { Tables } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: categories, error: errormassagecategory } = await supabase
    .from("drinkcategory")
    .select("*")
    .returns<[Tables<"drinkcategory">]>();

  if (errormassagecategory) {
    return new Response(
      JSON.stringify({ error: errormassagecategory.message }),
      {
        status: 500,
      }
    );
  }

  return new Response(JSON.stringify(categories), { status: 200 });
}
