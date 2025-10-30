import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface StarRatingProps {
  productId: number;
  currentRating?: number;
  averageRating?: number;
  totalRatings?: number;
  userId?: string;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  productId,
  currentRating = 0,
  averageRating = 0,
  totalRatings = 0,
  userId,
  onRate,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const displayRating = hoveredStar || currentRating || averageRating;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleClick = (rating: number) => {
    if (!readonly && userId && onRate) {
      onRate(rating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(displayRating);
          const isPartiallyFilled = star === Math.ceil(displayRating) && displayRating % 1 !== 0;

          return (
            <motion.button
              key={star}
              type="button"
              disabled={readonly || !userId}
              whileHover={!readonly && userId ? { scale: 1.1 } : {}}
              whileTap={!readonly && userId ? { scale: 0.95 } : {}}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && userId && setHoveredStar(star)}
              onMouseLeave={() => !readonly && setHoveredStar(null)}
              className={`transition-colors ${!readonly && userId ? "cursor-pointer" : "cursor-default"}`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled || isPartiallyFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : hoveredStar && star <= hoveredStar
                    ? "fill-yellow-200 text-yellow-200"
                    : "fill-transparent text-gray-300"
                }`}
              />
            </motion.button>
          );
        })}
      </div>
      {totalRatings > 0 && (
        <span className="text-sm text-muted-foreground">
          ({averageRating.toFixed(1)}) {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
        </span>
      )}
      {!readonly && userId && currentRating > 0 && (
        <span className="text-xs text-chart-3 font-medium">Your rating: {currentRating}</span>
      )}
    </div>
  );
}
