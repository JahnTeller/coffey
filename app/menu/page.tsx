"use client";
import { Tables } from "@/database.types";
import Header from "@/components/header";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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

const formSchema = z.object({
  drinks: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().min(0, { message: "Quantity must be at least 0" }),
      })
    )
    .refine((value) => value.some((item) => item.quantity > 0), {
      message: "At least one drink must have a quantity greater than 0",
    }),
  table: z.string({ required_error: "Chọn bàn của khách" }),
});

export default function Page() {
  const [categories, setCategories] = useState<Tables<"drinkcategory">[]>([]);
  const [drinks, setDrinks] = useState<Tables<"drink">[]>([]);
  const [selectedDrinks, setSelectedDrinks] = useState<
    { id: string; quantity: number }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await fetch(
          "http://localhost:3000/api/category"
        );
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        const drinksResponse = await fetch("http://localhost:3000/api/drink");
        const drinksData = await drinksResponse.json();
        setDrinks(drinksData);
      } catch (error) {
        console.error("Error fetching data:", error);
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

  const watchedDrinks = useWatch({ control: form.control, name: "drinks" });

  useEffect(() => {
    form.setValue("drinks", selectedDrinks);
  }, [selectedDrinks, form]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDrinks([...selectedDrinks, { id, quantity: 1 }]);
    } else {
      setSelectedDrinks(
        selectedDrinks.filter((drink) => drink.id.toString().toString() !== id)
      );
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setSelectedDrinks(
      selectedDrinks.map((drink) =>
        drink.id.toString().toString() === id ? { ...drink, quantity } : drink
      )
    );
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  // Group drinks by category
  const drinksByCategory = categories.map((category) => ({
    category,
    drinks: drinks.filter((drink) => drink.category_id === category.id),
  }));

  return (
    <div>
      <Header />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              <h2 className="text-lg font-bold">{category.name}</h2>
              <FormField
                control={form.control}
                name="drinks"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        {drinks.map((drink) => (
                          <div
                            key={drink.id.toString().toString()}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={drink.id.toString().toString().toString()}
                              checked={selectedDrinks.some(
                                (selected) =>
                                  selected.id === drink.id.toString().toString()
                              )}
                              onCheckedChange={(checked: boolean) =>
                                handleCheckboxChange(
                                  drink.id.toString().toString(),
                                  checked
                                )
                              }
                            />
                            <FormLabel
                              htmlFor={drink.id
                                .toString()
                                .toString()
                                .toString()}
                            >
                              {drink.name}
                            </FormLabel>
                            {selectedDrinks.some(
                              (selected) =>
                                selected.id === drink.id.toString().toString()
                            ) && (
                              <Input
                                type="number"
                                min="0"
                                value={
                                  selectedDrinks.find(
                                    (selected) =>
                                      selected.id ===
                                      drink.id.toString().toString()
                                  )?.quantity || 0
                                }
                                onChange={(e) =>
                                  handleQuantityChange(
                                    drink.id.toString().toString(),
                                    parseInt(e.target.value, 10)
                                  )
                                }
                              />
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

          <Button type="submit">Thêm </Button>
        </form>
      </Form>
    </div>
  );
}
