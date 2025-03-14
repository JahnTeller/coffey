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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await currentUser();
  console.log(body, "req.body");

  if (request.method === "POST") {
    const drinks = body.drinks;
    const table = body.table;

    try {
      // Create the order with fixed status "Chờ Xác Nhận"
      const { data: order, error: orderError } = await supabase
        .from("order")
        .insert([
          {
            table_number: parseInt(table.replace("table", ""), 10),
            status: "Chờ Xác Nhận", // Default status for new orders
            staff_id: user?.id,
          },
        ])
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order details
      const orderDetails = drinks.map((drink: any) => ({
        order_id: order.id,
        drink_id: parseInt(drink.id, 10),
        quantity: drink.quantity,
        note: drink.note,
      }));

      const { error: orderDetailError } = await supabase
        .from("order_detail")
        .insert(orderDetails);

      if (orderDetailError) {
        throw orderDetailError;
      }

      return NextResponse.json(
        { message: "Order and order details created successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error creating order:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Không được phép" }), {
      status: 401,
    });
  }

  // Fetch the staff role for the current user
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("role")
    .eq("userId", user.id)
    .single();

  if (staffError) {
    return new Response(
      JSON.stringify({ error: "Lỗi khi lấy thông tin nhân viên" }),
      { status: 500 }
    );
  }

  let query = supabase
    .from("order")
    .select("*, order_detail(*, drink(*))")
    .order("created_at", { ascending: false });

  // If the user is a waiter, only fetch their orders
  if (staff.role === "waiter") {
    query = query.eq("staff_id", user.id);
  }

  // If the user is a bartender, filter orders by status and time
  if (staff.role === "bartender") {
    const allowedStatuses = [
      "Chờ Xác Nhận",
      "Chờ Món",
      "Lên Món",
      "Đã Thanh Toán",
    ];

    // Get the current date and time
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(6, 0, 0, 0); // 6 AM
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 30, 0, 0); // 11 PM

    query = query
      .in("status", allowedStatuses) // Filter by allowed statuses
      .gte("created_at", startOfDay.toISOString()) // Orders created after 6 AM
      .lte("created_at", endOfDay.toISOString()) // Orders created before 11 PM
      .order("status", { ascending: true }) // Sort by status
      .order("created_at", { ascending: false }); // Sort by creation date (newest first)
  }

  // Fetch orders for the "Thanh Toán Bàn" feature
  const tableNumber = request.nextUrl.searchParams.get("table_number");
  const statusFilter = request.nextUrl.searchParams.get("status");
  console.log(tableNumber, statusFilter, "asdgfasdgf");

  if (tableNumber && statusFilter === "Lên Món") {
    query = query
      .eq("table_number", parseInt(tableNumber, 10))
      .eq("status", "Lên Món");
  }

  const { data: orders, error: ordersError } = await query;

  if (ordersError) {
    return new Response(JSON.stringify({ error: "Lỗi khi lấy đơn hàng" }), {
      status: 500,
    });
  }

  if (orders.length === 0) {
    return new Response(JSON.stringify({ error: "Không tìm thấy đơn hàng" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify(orders), { status: 200 });
}

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
  const { id, table_number, status, order_detail } = body;
  console.log(body, "body info");

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

    // Check if the current status is "Chờ Xác Nhận"
    if (currentOrder.status !== "Chờ Xác Nhận") {
      return NextResponse.json(
        {
          error:
            "Không thể cập nhật đơn vì trạng thái không phải 'Chờ Xác Nhận'",
        },
        { status: 400 }
      );
    }

    // Update the order
    const { data: updatedOrder, error: orderError } = await supabase
      .from("order")
      .update({
        table_number: table_number,
        status: status, // Ensure status is one of the allowed values
      })
      .eq("id", id)
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Update order details
    if (order_detail && Array.isArray(order_detail)) {
      for (const detail of order_detail) {
        const { error: detailError } = await supabase
          .from("order_detail")
          .update({
            quantity: detail.quantity,
            note: detail.note,
          })
          .eq("id", detail.id);

        if (detailError) {
          throw detailError;
        }
      }
    }

    return NextResponse.json(
      {
        message: "Order and order details updated successfully",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
