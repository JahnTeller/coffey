"use client";
import React from "react";
import { Database } from "@/database.types";
import Image from "next/image";

type CategoryCardProps = {
  category: Database["public"]["Tables"]["drinkcategory"]["Row"];
  onClick: (categoryId: string) => void;
};

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  return (
    <button
      key={category.created_at}
      className="flex flex-col items-center justify-center "
      // onClick={() => onClick(category.id.toString())}
    >
      {category.category_image_url ? (
        <div className="relative w-14 h-14">
          <Image
            src={category.category_image_url}
            alt={category.name}
            fill
            className=""
            sizes="100%"
          />
        </div>
      ) : (
        <div>No Image Available</div>
      )}
      <div className="text-sm">{category.name}</div>
    </button>
  );
}
