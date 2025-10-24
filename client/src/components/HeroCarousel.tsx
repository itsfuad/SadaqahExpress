import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CarouselSlide {
  id: number;
  image: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function HeroCarousel({ 
  slides, 
  autoPlayInterval = 5000,
  heroTitle = "Welcome to SadaqahExpress",
  heroSubtitle = "Your trusted source for premium digital products",
  ctaText = "Shop Now",
  onCtaClick
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden bg-muted">
      {/* Background Images - Rotating */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10" />
          <img
            src={slide.image}
            alt={`Slide ${slide.id}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Fixed Hero Content - Always Visible */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-4 font-serif">
              {heroTitle}
            </h2>
            <p className="text-lg md:text-2xl text-white/90 mb-6 md:mb-8">
              {heroSubtitle}
            </p>
            <Button 
              size="lg" 
              variant="default"
              className="bg-primary hover:bg-primary/90"
              onClick={onCtaClick}
              data-id="button-hero-cta"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => goToSlide(index)}
            data-id={`button-carousel-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
