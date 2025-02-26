import React from "react";
import { Database } from "@/database.types";
import Image from "next/image";

export default function CategoryCard(
  category: Database["public"]["Tables"]["drinkcategory"]["Row"]
) {
  return (
    <div
      key={category.created_at}
      className="flex flex-col items-center justify-center"
    >
      {category.category_image_url ? (
        <div className="relative h-20 w-20">
          <Image src={category.category_image_url} alt={category.name} fill />
        </div>
      ) : (
        <div>No Image Available</div>
      )}
      <div>{category.name}</div>
    </div>
  );
}
