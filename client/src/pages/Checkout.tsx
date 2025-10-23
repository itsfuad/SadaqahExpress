import { Header } from "@/components/Header";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const { toast } = useToast();

  const handleOrderSubmit = (data: any) => {
    toast({
      title: "Order Submitted!",
      description: "You will receive payment instructions via email shortly.",
    });
    
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemCount={0}
        onCartClick={() => {}}
        onSearchClick={() => {}}
      />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold font-serif">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your order information</p>
        </div>
        
        <CheckoutForm 
          total={1250.00}
          onSubmit={handleOrderSubmit}
        />
      </main>

      <Footer />
    </div>
  );
}
