import { createClient } from "@/utils/supabase/server";
import CategoryCard from "@/components/categoryCard";
import { Database, Tables } from "@/database.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default async function Page() {
  const supabase = await createClient();
  const { data: categories, error: errormassage } = await supabase
    .from("drinkcategory")
    .select("")
    .returns<[Tables<"drinkcategory">]>();

  if (errormassage) {
    console.error("Error fetching categories:", errormassage.message);
    return <div>Error loading categories</div>;
  }

  return (
    <div>
      <Carousel>
        <CarouselContent>
          {categories?.map(
            (
              category: Database["public"]["Tables"]["drinkcategory"]["Row"]
            ) => (
              <CarouselItem key={category.created_at} className="basis-1/6">
                <CategoryCard {...category} />
              </CarouselItem>
            )
          )}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
