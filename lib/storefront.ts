export const DEFAULT_COOKIE_OFFERINGS = [
  {
    id: "chocolate-chip",
    sku: "FF-COOKIE-CHOC-CHIP",
    name: "Chocolate Chip",
    description: "A classic bakery favorite loaded with chocolate chips and baked fresh for your order.",
    accent: "rose",
  },
  {
    id: "fruity-cookies",
    sku: "FF-COOKIE-FRUITY",
    name: "Fruity Cookies",
    description: "A bright, colorful cookie with a fun fruity flavor in every bite.",
    accent: "sage",
  },
  {
    id: "smores-cookies",
    sku: "FF-COOKIE-SMORES",
    name: "S’mores Cookies",
    description: "A campfire-inspired cookie with chocolate, marshmallow, and graham-style flavor.",
    accent: "gold",
  },
  {
    id: "sweet-salty-oatmeal",
    sku: "FF-COOKIE-OATMEAL",
    name: "Sweet & Salty Oatmeal",
    description: "A cozy oatmeal cookie with a balanced sweet-and-salty finish.",
    accent: "rose",
  },
  {
    id: "biscoff",
    sku: "FF-COOKIE-BISCOFF",
    name: "Biscoff",
    description: "A rich cookie inspired by the warm, caramelized flavor of Biscoff.",
    accent: "sage",
  },
  {
    id: "cookies-n-cream",
    sku: "FF-COOKIE-CREAM",
    name: "Cookies N Cream",
    description: "A creamy chocolate-cookie combination packed into a bakery-style cookie.",
    accent: "gold",
  },
  {
    id: "chocolate-pebbles",
    sku: "FF-COOKIE-PEBBLES",
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
  photoUrl?: string | null;
  accent?: string;
};

