import { ProductCard } from '../ProductCard';
import productImage from '@assets/generated_images/Windows_11_Pro_product_196eac28.png';

export default function ProductCardExample() {
  const product = {
    id: 1,
    name: "Windows 11 Pro",
    image: productImage,
    price: 400.00,
    originalPrice: 850.00,
    rating: 5,
    reviewCount: 19,
    badge: "Bestseller",
    category: "microsoft"
  };

  return (
    <div className="p-4">
      <ProductCard 
        product={product}
        onAddToCart={(p) => console.log('Added to cart:', p.name)}
      />
    </div>
  );
}
