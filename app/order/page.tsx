"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Shadcn Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Shadcn Dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input"; // Shadcn Input
import { Label } from "@/components/ui/label"; // Shadcn Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress"; // Shadcn Progress
import React from "react";

import { Order } from "@/lib/db.type";
import { Printer } from "lucide-react"; // Import a printer icon
import { RotateCw } from "lucide-react";
import { toast } from "sonner"; // For toast notifications
import { User } from "@/lib/db.type";

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null); // State to track the order being edited
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility
  const [availableDrinks, setAvailableDrinks] = useState<
    { id: number; name: string; price: number }[]
  >([]); // State to store available drinks
  const [user, setUser] = useState<User>();
  const [sortBy, setSortBy] = useState<"status" | "date">("status"); // State to track sorting criteria
  const allowedStatuses = [
    "Chờ Xác Nhận",
    "Chờ Món",
    "Lên Món",
    "Đã Thanh Toán",
  ];
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/order`
        );
        if (!response.ok) {
          throw new Error("Chưa có đơn trong ngày");
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`
        );
        if (!response.ok) {
          throw new Error("Chưa có đơn trong ngày");
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/drink`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch drinks");
        }
        const data = await response.json();
        setAvailableDrinks(data);
      } catch (error) {
        console.error("Error fetching drinks:", error);
      }
    };
    fetchDrinks();
  }, []);
  const fetchTableOrders = async (tableNumber: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/order?table_number=${tableNumber}&status=Lên Món`
      );
      if (!response.ok) {
        throw new Error("Lỗi khi lấy đơn hàng");
      }
      const data = await response.json();
      setTableOrders(data);
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error("Lỗi khi lấy đơn hàng");
    }
  };
  const handleTableSelect = (tableNumber: number) => {
    setSelectedTable(tableNumber);
    fetchTableOrders(tableNumber);
    setIsPaymentDialogOpen(true);
  };

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!selectedTable || tableOrders.length === 0) return;

    try {
      // Update the status of all orders to "Đã Thanh Toán"
      const updatePromises = tableOrders.map((order) =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/order/updatestatus`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Đã Thanh Toán", id: order.id }),
        })
      );

      await Promise.all(updatePromises);

      // Refresh the orders list
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/order`
      );
      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật đơn hàng");
      }
      const data = await response.json();
      setOrders(data);

      // Show success toast
      toast.success("Thanh toán thành công");

      // Print the bill
      handlePrintBillForTable(selectedTable);

      // Close dialogs
      setIsPaymentDialogOpen(false);
      setIsConfirmationDialogOpen(false);
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error("Lỗi khi thanh toán");
    }
  };

  // Print bill for the selected table
  const handlePrintBillForTable = (tableNumber: number) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Hóa Đơn Bàn ${tableNumber}</h1>
        ${tableOrders
          .map(
            (order) => `
          <div style="margin-bottom: 20px;">
            <p><strong>Thời gian:</strong> ${format(
              new Date(order.created_at),
              "HH:mm:ss dd/MM/yyyy"
            )}</p>
            <p><strong>Trạng thái:</strong> ${order.status}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 8px;">Tên món</th>
                  <th style="border: 1px solid #000; padding: 8px;">Số lượng</th>
                  <th style="border: 1px solid #000; padding: 8px;">Đơn giá</th>
                  <th style="border: 1px solid #000; padding: 8px;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_detail
                  .map(
                    (item) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px;">${
                      item.drink.name
                    }</td>
                    <td style="border: 1px solid #000; padding: 8px;">${
                      item.quantity
                    }</td>
                    <td style="border: 1px solid #000; padding: 8px;">${item.drink.price.toLocaleString()} VND</td>
                    <td style="border: 1px solid #000; padding: 8px;">${(
                      item.drink.price * item.quantity
                    ).toLocaleString()} VND</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <p style="text-align: right; font-size: 18px; margin-top: 10px;">
              <strong>Tổng tiền:</strong> ${order.order_detail
                .reduce(
                  (total, item) => total + item.drink.price * item.quantity,
                  0
                )
                .toLocaleString()} VND
            </p>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    const printWindow = window.open("", "_blank");
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = allowedStatuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % allowedStatuses.length;
    return allowedStatuses[nextIndex];
  };
  const handleStatusChange = async (order: Order) => {
    const newStatus = getNextStatus(order.status);
    if (order.status === "Chờ Lên Món" || order.status === "Đã Thanh Toán") {
      toast.info("Không thể thay đổi trạng thái của đơn hàng này");
      return;
    }

    // Show confirmation dialog
    const confirmChange = window.confirm(
      `Bạn có chắc chắn muốn đổi trạng thái từ "${order.status}" sang "${newStatus}"?`
    );

    if (!confirmChange) return;

    try {
      // Save the old status for undo
      const oldStatus = order.status;

      // Update the order status locally
      const updatedOrder = { ...order, status: newStatus };
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === order.id ? updatedOrder : o))
      );

      // Show toast with undo option
      toast.success(`Trạng thái đã được đổi thành "${newStatus}"`, {
        action: {
          label: (
            <span className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" /> Hoàn tác
            </span>
          ),
          onClick: async () => {
            // Revert the status change
            setOrders((prevOrders) =>
              prevOrders.map((o) =>
                o.id === order.id ? { ...o, status: oldStatus } : o
              )
            );

            // Show undo confirmation toast
            toast.info(`Trạng thái đã được hoàn tác về "${oldStatus}"`);
          },
        },
      });

      // Send the update to the server
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/order/updatestatus`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: order.id,
            status: newStatus, // Include order details if needed
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific error messages from the API
        throw new Error(responseData.error || "Lỗi khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);

      // Revert the status change if the server update fails
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === order.id ? { ...o, status: order.status } : o
        )
      );

      // Show error toast
      toast.error(
        error instanceof Error
          ? error.message
          : "Đã có lỗi xảy ra khi cập nhật trạng thái"
      );
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order); // Set the order to be edited
    setIsDialogOpen(true); // Open the dialog
  };

  const handlePrintBill = (order: Order) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Hóa Đơn</h1>
        <p><strong>Thời gian:</strong> ${format(
          new Date(order.created_at),
          "HH:mm:ss dd/MM/yyyy"
        )}</p>
        <p><strong>Bàn số:</strong> ${order.table_number}</p>
        <p><strong>Trạng thái:</strong> ${order.status}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px;">Tên món</th>
              <th style="border: 1px solid #000; padding: 8px;">Số lượng</th>
              <th style="border: 1px solid #000; padding: 8px;">Đơn giá</th>
              <th style="border: 1px solid #000; padding: 8px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_detail
              .map(
                (item) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">${
                  item.drink.name
                }</td>
                <td style="border: 1px solid #000; padding: 8px;">${
                  item.quantity
                }</td>
                <td style="border: 1px solid #000; padding: 8px;">${item.drink.price.toLocaleString()} VND</td>
                <td style="border: 1px solid #000; padding: 8px;">${(
                  item.drink.price * item.quantity
                ).toLocaleString()} VND</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p style="text-align: right; font-size: 18px; margin-top: 20px;">
          <strong>Tổng tiền:</strong> ${order.order_detail
            .reduce(
              (total, item) => total + item.drink.price * item.quantity,
              0
            )
            .toLocaleString()} VND
        </p>
      </div>
    `;

    const printWindow = window.open("", "_blank");
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  const handleSave = async () => {
    if (!editingOrder) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingOrder),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      // Update the orders state with the edited order
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === editingOrder.id ? editingOrder : order
        )
      );

      setIsDialogOpen(false); // Close the dialog
      setEditingOrder(null); // Clear the editing order
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleDrinkChange = (
    drinkId: number,
    field: string,
    value: string | number
  ) => {
    setEditingOrder((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        order_detail: prev.order_detail.map((item) =>
          item.drink_id === drinkId ? { ...item, [field]: value } : item
        ),
      };
    });
  };

  const handleAddDrink = (drinkId: number) => {
    const drink = availableDrinks.find((d) => d.id === drinkId);
    if (!drink) return;

    setEditingOrder((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        order_detail: [
          ...prev.order_detail,
          {
            id: Date.now(), // Temporary ID for new drink
            drink_id: drink.id,
            drink: drink,
            quantity: 1,
            note: "",
            order_id: prev.id,
          },
        ],
      };
    });
  };

  const handleRemoveDrink = (drinkId: number) => {
    setEditingOrder((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        order_detail: prev.order_detail.filter(
          (item) => item.drink_id !== drinkId
        ),
      };
    });
  };

  // Add this utility function to format the price
  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Sort orders based on the selected criteria
  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === "status") {
      return (
        allowedStatuses.indexOf(a.status) - allowedStatuses.indexOf(b.status)
      );
    } else {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Progress value={50} className="w-[60%]" /> {/* Loading indicator */}
        <p className="mt-4">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex gap-3">
        <div className="mb-4">
          <Button onClick={() => setIsPaymentDialogOpen(true)}>
            Thanh Toán Bàn
          </Button>
        </div>

        {/* Payment Dialog */}
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chọn bàn để thanh toán</DialogTitle>
              <DialogDescription>
                Vui lòng chọn số bàn để xem các đơn hàng chờ thanh toán.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                onValueChange={(value) =>
                  handleTableSelect(parseInt(value, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bàn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Bàn 1</SelectItem>
                  <SelectItem value="2">Bàn 2</SelectItem>
                  <SelectItem value="3">Bàn 3</SelectItem>
                  {/* Add more tables as needed */}
                </SelectContent>
              </Select>
              {tableOrders.length > 0 && (
                <div>
                  <p className="font-semibold">Đơn hàng chờ thanh toán:</p>
                  <ul>
                    {tableOrders.map((order) => (
                      <li key={order.id}>
                        {format(
                          new Date(order.created_at),
                          "HH:mm:ss dd/MM/yyyy"
                        )}{" "}
                        - Tổng tiền:{" "}
                        {formatPrice(
                          order.order_detail.reduce(
                            (total, item) =>
                              total + item.drink.price * item.quantity,
                            0
                          )
                        )}{" "}
                        VND
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                onClick={() => setIsConfirmationDialogOpen(true)}
                disabled={tableOrders.length === 0}
              >
                Xác nhận thanh toán
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={isConfirmationDialogOpen}
          onOpenChange={setIsConfirmationDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận thanh toán</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn thanh toán các đơn hàng của bàn{" "}
                {selectedTable}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handlePaymentConfirm}>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex justify-end mb-4">
          <Select
            onValueChange={(value) => setSortBy(value as "status" | "date")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="status">Sort by Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableCaption>Danh sách order</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]" rowSpan={2}>
              Thời gian tạo
            </TableHead>
            <TableHead rowSpan={2}>Bàn</TableHead>
            <TableHead colSpan={3}>Danh sách món</TableHead>
            <TableHead rowSpan={2}>Tình Trạng</TableHead>
            <TableHead className="text-right" rowSpan={2}>
              Tổng tiền
            </TableHead>
            <TableHead rowSpan={2}>Hành động</TableHead>
          </TableRow>
          <TableRow>
            <TableHead>Tên món</TableHead>
            <TableHead>Số lượng</TableHead>
            <TableHead>Ghi chú</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.map((order) => (
            <React.Fragment key={order.id}>
              {order.order_detail.map((item, index) => (
                <TableRow key={`${order.id}-${item.id}`}>
                  {index === 0 && (
                    <>
                      <TableCell rowSpan={order.order_detail.length}>
                        {format(
                          new Date(order.created_at),
                          "HH:mm:ss dd/MM/yyyy"
                        )}
                      </TableCell>
                      <TableCell rowSpan={order.order_detail.length}>
                        {order.table_number}
                      </TableCell>
                    </>
                  )}
                  <TableCell>{item.drink.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.note}</TableCell>
                  {index === 0 && (
                    <>
                      <TableCell rowSpan={order.order_detail.length}>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange(order)}
                          className="w-full"
                          disabled={user?.staffInfo?.role === "waiter"} // Disable if user role is "waiter"
                        >
                          {order.status}
                        </Button>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        rowSpan={order.order_detail.length}
                      >
                        {formatPrice(
                          order.order_detail.reduce(
                            (total, item) =>
                              total + item.drink.price * item.quantity,
                            0
                          )
                        )}
                      </TableCell>

                      <TableCell rowSpan={order.order_detail.length}>
                        <Dialog
                          open={isDialogOpen}
                          onOpenChange={setIsDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleEdit(order)}
                              disabled={order.status !== "Chờ Xác Nhận"} // Disable if status is not "Chờ Xác Nhận"
                            >
                              Sửa
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Sửa đơn</DialogTitle>
                              <DialogDescription>
                                Chỉnh sửa thông tin đơn
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Bàn số</Label>
                                <Input
                                  value={editingOrder?.table_number || ""}
                                  onChange={(e) =>
                                    setEditingOrder((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            table_number: parseInt(
                                              e.target.value
                                            ),
                                          }
                                        : null
                                    )
                                  }
                                />
                              </div>

                              <div>
                                <Label>Trạng Thái</Label>
                                <Select
                                  value={editingOrder?.status || ""}
                                  disabled={user?.staffInfo?.role === "waiter"} // Disable if user role is "waiter"
                                  onValueChange={(value) =>
                                    setEditingOrder((prev) =>
                                      prev ? { ...prev, status: value } : null
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allowedStatuses.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Danh sách món</Label>
                                {editingOrder?.order_detail.map((item) => (
                                  <div
                                    key={item.drink_id}
                                    className="space-y-2"
                                  >
                                    <p className="font-medium">
                                      {item.drink.name}
                                    </p>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleDrinkChange(
                                            item.drink_id,
                                            "quantity",
                                            parseInt(e.target.value)
                                          )
                                        }
                                      />
                                      <Input
                                        value={item.note}
                                        onChange={(e) =>
                                          handleDrinkChange(
                                            item.drink_id,
                                            "note",
                                            e.target.value
                                          )
                                        }
                                      />
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          handleRemoveDrink(item.drink_id)
                                        }
                                      >
                                        Xóa
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <Label>Thêm món</Label>
                                <Select
                                  onValueChange={(value) =>
                                    handleAddDrink(parseInt(value, 10))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn món" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableDrinks.map((drink) => (
                                      <SelectItem
                                        key={drink.id}
                                        value={drink.id.toString()}
                                      >
                                        {drink.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleSave}>Save</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {order.status === "Đã Thanh Toán" && (
                          <Button
                            variant="outline"
                            onClick={() => handlePrintBill(order)}
                            className="flex items-center gap-2"
                          >
                            <Printer className="h-4 w-4" /> In hóa đơn
                          </Button>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
