import { CategoryNav } from '../CategoryNav';
import { useState } from 'react';

export default function CategoryNavExample() {
  const [active, setActive] = useState('all');
  
  return (
    <CategoryNav 
      activeCategory={active}
      onCategoryChange={(cat) => {
        setActive(cat);
        console.log('Category changed to:', cat);
      }}
    />
  );
}
