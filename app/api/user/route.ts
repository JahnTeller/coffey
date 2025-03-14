import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // Get the current user from Clerk
    const user = await currentUser();

    // If no user is found, return an unauthorized response
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Fetch staff information from Supabase
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .eq("userId", user.id)
      .single();

    // If there's an error fetching staff data, return the error
    if (staffError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch staff data", details: staffError }),
        { status: 500 }
      );
    }

    // Combine user info from Clerk and staff info from Supabase
    const userInfo = {
      clerkUser: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
      },
      staffInfo: staff,
    };

    // Return the combined user info
    return new Response(JSON.stringify(userInfo), { status: 200 });
  } catch (error) {
    console.error("Error in GET request:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error }),
      { status: 500 }
    );
  }
}