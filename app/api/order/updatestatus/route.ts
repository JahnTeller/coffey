import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { table } from "console";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export async function PUT(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the staff role for the current user
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("role")
    .eq("userId", user.id)
    .single();

  if (staffError) {
    return NextResponse.json(
      { error: "Failed to fetch staff information" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { id, status } = body;

  // Validate status
  const allowedStatuses = [
    "Chờ Xác Nhận",
    "Chờ Món",
    "Lên Món",
    "Đã Thanh Toán",
  ];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json(
      {
        error:
          "Invalid status. Allowed values are: Chờ Xác Nhận, Chờ Món, Lên Món, Đã Thanh Toán",
      },
      { status: 400 }
    );
  }

  try {
    // Fetch the current order to check its status
    const { data: currentOrder, error: fetchError } = await supabase
      .from("order")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Check if the current status is "Đã Thanh Toán"
    if (currentOrder.status === "Đã Thanh Toán") {
      return NextResponse.json(
        {
          error:
            "Không thể cập nhật đơn vì trạng thái không phải 'Đã Thanh Toán'",
        },
        { status: 400 }
      );
    }

    // Update the order
    const { data: updatedOrder, error: orderError } = await supabase
      .from("order")
      .update({
        status: status, // Ensure status is one of the allowed values
      })
      .eq("id", id)
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    return NextResponse.json(
      {
        message: "Trạng thái đơn cập nhật thành công",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    return NextResponse.json(
      { error: "Thất bại cập nhật trạng thái đơn" },
      { status: 500 }
    );
  }
}
