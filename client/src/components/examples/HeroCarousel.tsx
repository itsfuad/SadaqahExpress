import { HeroCarousel } from '../HeroCarousel';
import heroImage1 from '@assets/generated_images/Windows_10_Pro_hero_banner_83c8c954.png';
import heroImage2 from '@assets/generated_images/Office_2021_hero_banner_5189d70c.png';
import heroImage3 from '@assets/generated_images/YouTube_Premium_hero_banner_0af84554.png';

export default function HeroCarouselExample() {
  const slides = [
    {
      id: 1,
      image: heroImage1,
      title: "GET YOUR WINDOWS 10 PRO NOW",
      subtitle: "OFFER PRICE",
      price: "350 BDT",
      ctaText: "Shop Now",
    },
    {
      id: 2,
      image: heroImage2,
      title: "OFFICE 2021",
      subtitle: "Professional Plus",
      price: "500 BDT",
      ctaText: "Shop Now",
    },
    {
      id: 3,
      image: heroImage3,
      title: "YOUTUBE PREMIUM",
      subtitle: "Ad-Free Experience",
      price: "400 BDT",
      ctaText: "Shop Now",
    },
  ];

  return <HeroCarousel slides={slides} />;
}
