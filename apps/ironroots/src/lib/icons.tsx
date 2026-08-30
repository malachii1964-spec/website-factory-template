import {
  Leaf,
  Carrot,
  Wheat,
  Apple,
  Sprout,
  Circle,
  Package,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  leaf: Leaf,
  carrot: Carrot,
  wheat: Wheat,
  apple: Apple,
  sprout: Sprout,
  circle: Circle,
  package: Package,
};

export function ProductIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = MAP[name] ?? Leaf;
  return <Icon className={className} strokeWidth={1.6} aria-hidden />;
}
