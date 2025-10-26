import { Link } from "wouter";

export function Footer() {

  const quickLinks = [
    { id: "/track-order", label: "Track Your Order" },
  ]

  return (
    <footer className="bg-muted mt-12">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <div className="flex flex-col md:flex-row justify-around gap-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/favicon.png" alt="Sadaqah Express Logo" className="h-8" />
                <div>
                  <h3 className="font-bold text-lg font-serif">Sadaqah Express</h3>
                  <p className="text-xs text-muted-foreground">Digital Products</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted source for premium digital products, software licenses and subscriptions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.id}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Sadaqah Express. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Whatsapp & Telegram: 017 856 856 54
            </p>
            <p className="text-sm text-muted-foreground">
              Developed by{" "}
              <a
                href="https://github.com/itsfuad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline font-medium"
              >
                itsfuad
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
