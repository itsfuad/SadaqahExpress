import { ShoppingCart } from '../ShoppingCart';
import { useState } from 'react';
import productImage from '@assets/generated_images/Windows_11_Pro_product_196eac28.png';

export default function ShoppingCartExample() {
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Windows 11 Pro",
      image: productImage,
      price: 400.00,
      quantity: 2,
    },
    {
      id: 2,
      name: "Office 365",
      image: productImage,
      price: 450.00,
      quantity: 1,
    },
  ]);

  return (
    <ShoppingCart
      isOpen={true}
      items={items}
      onClose={() => console.log('Close cart')}
      onUpdateQuantity={(id, qty) => {
        setItems(items.map(item => 
          item.id === id ? { ...item, quantity: qty } : item
        ));
      }}
      onRemoveItem={(id) => {
        setItems(items.filter(item => item.id !== id));
      }}
      onCheckout={() => console.log('Checkout clicked')}
    />
  );
}
