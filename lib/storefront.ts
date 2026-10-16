export const DEFAULT_COOKIE_OFFERINGS = [
  {
    id: "chocolate-chip",
    name: "Chocolate Chip",
    description: "A classic bakery favorite loaded with chocolate chips and baked fresh for your order.",
    accent: "rose",
  },
  {
    id: "fruity-cookies",
    name: "Fruity Cookies",
    description: "A bright, colorful cookie with a fun fruity flavor in every bite.",
    accent: "sage",
  },
  {
    id: "smores-cookies",
    name: "S’mores Cookies",
    description: "A campfire-inspired cookie with chocolate, marshmallow, and graham-style flavor.",
    accent: "gold",
  },
  {
    id: "sweet-salty-oatmeal",
    name: "Sweet & Salty Oatmeal",
    description: "A cozy oatmeal cookie with a balanced sweet-and-salty finish.",
    accent: "rose",
  },
  {
    id: "biscoff",
    name: "Biscoff",
    description: "A rich cookie inspired by the warm, caramelized flavor of Biscoff.",
    accent: "sage",
  },
  {
    id: "cookies-n-cream",
    name: "Cookies N Cream",
    description: "A creamy chocolate-cookie combination packed into a bakery-style cookie.",
    accent: "gold",
  },
  {
    id: "chocolate-pebbles",
    name: "Chocolate Pebbles",
    description: "A chocolate-forward cookie with a playful crunchy cereal-inspired finish.",
    accent: "rose",
  },
] as const;

export type StorefrontOffering = {
  id: string;
  name: string;
  description: string;
  priceCents?: number | null;
  accent?: string;
};

