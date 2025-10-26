import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield, Clock, Headphones } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onSearchClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-4">About Sadaqah Express</h1>
          <p className="text-lg text-muted-foreground">
            Your trusted partner for premium digital products and software solutions
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Who We Are</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sadaqah Express is a digital marketplace specializing in authentic software licenses, 
                subscriptions, and premium digital products. We bridge the gap between quality software 
                and affordable pricing, making essential tools accessible to everyone.
              </p>
              <p className="text-muted-foreground">
                Founded with a mission to provide genuine, licensed software at competitive prices, 
                we've built our reputation on trust, reliability, and exceptional customer service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">What We Offer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Microsoft Products:</strong> Genuine Windows, Office, and enterprise solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>AI Tools:</strong> ChatGPT Plus, Claude, and other AI subscriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Security Software:</strong> Antivirus, VPN, and privacy tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Streaming Services:</strong> Entertainment and media subscriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Educational & Creative Tools:</strong> Software for learning and content creation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">Genuine Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All our products are 100% authentic and sourced directly from authorized distributors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">Secure Delivery</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Instant digital delivery with secure activation keys and comprehensive setup guides.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">Fast Response</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Quick order processing and prompt customer support to get you up and running.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Headphones className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">Dedicated Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our team is here to help via WhatsApp and Telegram for any questions or issues.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're committed to providing not just products, but complete solutions. Every purchase 
                comes with our assurance of authenticity, installation support, and after-sales service.
              </p>
              <p className="text-muted-foreground">
                Whether you're a student, professional, or business owner, we're here to help you access 
                the tools you need to succeed.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-bold font-serif">Get in Touch</h2>
          <p className="text-muted-foreground">
            Have questions? Contact us via WhatsApp or Telegram
          </p>
          <p className="text-lg font-semibold text-primary">
            017 856 856 54
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
