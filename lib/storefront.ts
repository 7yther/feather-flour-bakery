export const DEFAULT_COOKIE_OFFERINGS = [
  {
    id: "custom-decorated",
    name: "Custom decorated cookies",
    description: "Hand-decorated sugar cookies matched to your colors, theme, and celebration.",
    accent: "rose",
  },
  {
    id: "logo-cookies",
    name: "Logo & business cookies",
    description: "Branded cookie sets for openings, client gifts, launches, and team events.",
    accent: "sage",
  },
  {
    id: "personalized-favors",
    name: "Personalized cookie favors",
    description: "Individually detailed favors for weddings, showers, birthdays, and milestones.",
    accent: "gold",
  },
] as const;

export type StorefrontOffering = {
  id: string;
  name: string;
  description: string;
  priceCents?: number | null;
  accent?: string;
};

