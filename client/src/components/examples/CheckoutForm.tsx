import { CheckoutForm } from '../CheckoutForm';

export default function CheckoutFormExample() {
  return (
    <CheckoutForm 
      total={1250.00}
      onSubmit={(data) => console.log('Order submitted:', data)}
    />
  );
}
