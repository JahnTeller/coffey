"use client";
import { Tables } from "@/database.types";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

import { toast } from "sonner";

const formSchema = z.object({
  drinks: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().min(0, { message: "Số lượng phải lớn hơn một!" }),
        note: z.string().optional(),
      })
    )
    .refine((value) => value.some((item) => item.quantity > 0), {
      message: "Ít nhất một món phải dc chọn",
    }),
  table: z.string({ required_error: "Chọn bàn của khách" }),
});

export default function Home() {
  const [categories, setCategories] = useState<Tables<"drinkcategory">[]>([]);
  const [drinks, setDrinks] = useState<Tables<"drink">[]>([]);
  const [selectedDrinks, setSelectedDrinks] = useState<
    { id: string; quantity: number; note: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // State for AlertDialog

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const categoriesResponse = await fetch(`${baseUrl}/category`);
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        const drinksResponse = await fetch(`${baseUrl}/drink`);
        const drinksData = await drinksResponse.json();
        setDrinks(drinksData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drinks: [],
      table: "table01",
    },
  });

  useEffect(() => {
    form.setValue("drinks", selectedDrinks);
  }, [selectedDrinks, form]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDrinks([...selectedDrinks, { id, quantity: 1, note: "" }]);
    } else {
      setSelectedDrinks(
        selectedDrinks.filter((drink) => drink.id.toString() !== id)
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Progress value={50} className="w-[60%]" /> {/* Loading indicator */}
        <p className="mt-4">Đang tải menu...</p>
      </div>
    );
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    setSelectedDrinks(
      selectedDrinks.map((drink) =>
        drink.id.toString() === id ? { ...drink, quantity } : drink
      )
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setSelectedDrinks(
      selectedDrinks.map((drink) =>
        drink.id.toString() === id ? { ...drink, note: note } : drink
      )
    );
  };

  const handleSubmitConfirm = async () => {
    setIsAlertOpen(false); // Close the AlertDialog
    await form.handleSubmit(onSubmit)(); // Submit the form
    setSelectedDrinks([]); // Reset selected drinks
    form.reset(); // Reset the form
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );
      const result = await response.json();
      console.log(result);

      toast.success("Đặt món thành công 🎉", {
        description: "Đơn hàng đã được ghi nhận thành công!",
      });
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Lỗi", {
        description: "Đã có lỗi xảy ra khi đặt món",
      });
    }
  }

  // Group drinks by category
  const drinksByCategory = categories.map((category) => ({
    category,
    drinks: drinks.filter((drink) => drink.category_id === category.id),
  }));

  return (
    <div className="p-3 mb-10">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            setIsAlertOpen(true); // Open the AlertDialog
          }}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="table"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn bàn" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="table01">Bàn 01</SelectItem>
                    <SelectItem value="table02">Bàn 02</SelectItem>
                    <SelectItem value="table03">Bàn 03</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Chọn bàn</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {drinksByCategory.map(({ category, drinks }) => (
            <div key={category.id}>
              <h2 className="text-lg font-bold pb-3">{category.name}</h2>
              <FormField
                control={form.control}
                name="drinks"
                render={({}) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-5">
                        {drinks.map((drink) => (
                          <div
                            key={drink.id.toString()}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={drink.id.toString().toString()}
                              checked={selectedDrinks.some(
                                (selected) =>
                                  selected.id === drink.id.toString()
                              )}
                              onCheckedChange={(checked: boolean) =>
                                handleCheckboxChange(
                                  drink.id.toString(),
                                  checked
                                )
                              }
                            />
                            <FormLabel htmlFor={drink.id.toString().toString()}>
                              {drink.name}
                            </FormLabel>
                            {selectedDrinks.some(
                              (selected) => selected.id === drink.id.toString()
                            ) && (
                              <>
                                <Input
                                  className="w-20"
                                  type="number"
                                  min="0"
                                  value={
                                    selectedDrinks.find(
                                      (selected) =>
                                        selected.id === drink.id.toString()
                                    )?.quantity || 0
                                  }
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      drink.id.toString(),
                                      parseInt(e.target.value, 10)
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Ghi chú"
                                  value={
                                    selectedDrinks?.find(
                                      (selected) =>
                                        selected.id === drink.id.toString()
                                    )?.note || ""
                                  }
                                  onChange={(e) =>
                                    handleNoteChange(
                                      drink.id.toString(),
                                      e.target.value
                                    )
                                  }
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button type="submit" className="bg-green-300 text-black">
                Thêm
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận đặt món</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn đặt những món này không?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitConfirm}>
                  Xác nhận
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </Form>
    </div>
  );
}
