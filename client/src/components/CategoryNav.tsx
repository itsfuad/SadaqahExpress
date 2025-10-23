import { 
  Laptop, 
  Shield, 
  Key, 
  Youtube, 
  GraduationCap, 
  Film, 
  Music, 
  Wrench 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "all", label: "ALL", icon: null },
  { id: "microsoft", label: "MICROSOFT", icon: Laptop },
  { id: "antivirus", label: "ANTI VIRUS", icon: Shield },
  { id: "vpn", label: "VPN", icon: Key },
  { id: "streaming", label: "STREAMING", icon: Youtube },
  { id: "educational", label: "EDUCATIONAL", icon: GraduationCap },
  { id: "editing", label: "EDITING", icon: Film },
  { id: "music", label: "MUSIC", icon: Music },
  { id: "utilities", label: "UTILITIES", icon: Wrench },
];

interface CategoryNavProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function CategoryNav({ activeCategory = "all", onCategoryChange }: CategoryNavProps) {
  return (
    <div className="w-full bg-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`whitespace-nowrap gap-2 text-primary-foreground hover:text-primary-foreground ${
                  isActive ? 'text-foreground' : ''
                }`}
                onClick={() => onCategoryChange?.(category.id)}
                data-testid={`button-category-${category.id}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="text-xs md:text-sm font-semibold">{category.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
