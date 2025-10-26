import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onSearchClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">Terms of Service</h1>
        </div>

        <div className="space-y-6">
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-800 dark:text-yellow-200" />
                <CardTitle className="text-yellow-800 dark:text-yellow-200">
                  Important Notice
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please read these terms carefully before using our services. By placing an order, 
                you agree to be bound by these terms and conditions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                By accessing and using Sadaqah Express, you accept and agree to be bound by the terms 
                and provisions of this agreement. If you do not agree to these terms, please do not 
                use our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Products and Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We provide authentic digital products including software licenses, subscriptions, and 
                digital services. All products sold are genuine and sourced from authorized distributors.
              </p>
              <p>
                Product descriptions, features, and specifications are provided in good faith. We reserve 
                the right to modify product offerings without prior notice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Payment and Order Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p className="font-semibold text-foreground">
                Manual Payment Processing:
              </p>
              <p>
                All payments are processed manually through direct communication. After placing an order, 
                you will receive payment instructions via email. Please allow some time for our team to 
                review and confirm your payment.
              </p>
              <p>
                We accept various payment methods and will communicate the available options during the 
                order process. Orders are confirmed only after payment verification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Digital products are delivered electronically to your registered email address after 
                payment confirmation. Delivery times may vary but typically occur within a few hours 
                of payment verification.
              </p>
              <p>
                Please ensure your email address is correct and check your spam folder if you don't 
                receive your order within the expected timeframe.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Refunds and Cancellations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Due to the digital nature of our products, refunds are generally not available once 
                the product key or license has been delivered and activated.
              </p>
              <p>
                Exceptions may be made in cases of:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Product key not working despite following instructions</li>
                <li>Wrong product delivered</li>
                <li>Technical issues on our end preventing product delivery</li>
              </ul>
              <p>
                Please contact us within 24 hours of delivery if you encounter any issues.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. License and Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Products sold are for personal or commercial use as specified in the product description. 
                You may not resell, redistribute, or share license keys with unauthorized parties.
              </p>
              <p>
                Software licenses are subject to the end-user license agreements (EULA) of the respective 
                software publishers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Customer Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We provide installation support and assistance for products purchased through our platform. 
                Contact us via WhatsApp or Telegram at <strong>017 856 856 54</strong> for support.
              </p>
              <p>
                Support is available for product activation, installation guidance, and resolving 
                technical issues related to your purchase.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We respect your privacy and handle your personal information with care. Your data is 
                used solely for order processing, delivery, and customer support.
              </p>
              <p>
                We do not share your personal information with third parties except as necessary to 
                fulfill your order or as required by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Sadaqah Express is not liable for any damages arising from the use or inability to use 
                our products, including but not limited to data loss, system failures, or compatibility 
                issues.
              </p>
              <p>
                We act as a reseller of digital products and are not responsible for software bugs, 
                updates, or issues caused by the software publishers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting on our website. Continued use of our services after changes 
                constitutes acceptance of the modified terms.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            By using Sadaqah Express, you acknowledge that you have read, understood, and agree to be 
            bound by these Terms of Service.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
