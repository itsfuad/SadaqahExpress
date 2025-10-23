import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-lg font-serif">SadaqahExpress</h3>
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
          </div>
        </div>

        <div className="border-t py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SadaqahExpress. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Hotline: (+880) 123-4567890
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
