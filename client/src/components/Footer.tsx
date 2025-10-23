import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiVisa, SiMastercard, SiPaypal } from "react-icons/si";

export function Footer() {
  const categories = [
    "Microsoft Products",
    "Anti Virus",
    "VPN Services",
    "Streaming",
    "Educational",
    "Editing Software",
  ];

  const quickLinks = [
    "Track Your Order",
    "About Us",
    "Contact Us",
    "Privacy Policy",
    "Terms & Conditions",
    "Return Policy",
  ];

  return (
    <footer className="bg-muted mt-12">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">BD</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg font-serif">TechPark</h3>
                  <p className="text-xs text-muted-foreground">Digital Products</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted source for premium digital products, software licenses, and streaming subscriptions.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" data-testid="button-social-facebook">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-social-twitter">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-social-instagram">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-social-youtube">
                  <Youtube className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                {categories.map((category, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-category-${index}`}
                    >
                      {category}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-quick-${index}`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to get special offers and updates.
              </p>
              <div className="flex gap-2 mb-4">
                <Input
                  type="email"
                  placeholder="Your email"
                  data-testid="input-newsletter"
                />
                <Button data-testid="button-subscribe">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">We Accept</p>
                <div className="flex gap-3 items-center">
                  <SiVisa className="h-8 w-8 text-foreground" />
                  <SiMastercard className="h-8 w-8 text-foreground" />
                  <SiPaypal className="h-8 w-8 text-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 BD TechPark. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Hotline: (+880) 183-9545699
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
