import { Header } from '../Header';
import { ThemeProvider } from '../ThemeProvider';

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Header 
        cartItemCount={3} 
        onCartClick={() => console.log('Cart clicked')}
        onSearchClick={() => console.log('Search clicked')}
      />
    </ThemeProvider>
  );
}
