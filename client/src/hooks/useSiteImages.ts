import { useQuery } from "@tanstack/react-query";

// Pictures on the home page that admins can replace in Admin -> Gallery Manager.
export const SITE_IMAGE_DEFAULTS: Record<string, string> = {
  hero: "/images/hero-lpg-facility.svg",
  about: "/images/installation-team.svg",
  commercial: "/images/commercial-kitchen-lpg.svg",
  safety: "/images/lpg-safety-equipment.svg",
};

export function useSiteImage(key: keyof typeof SITE_IMAGE_DEFAULTS | string) {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-images"],
    staleTime: 60_000,
    retry: 1,
  });
  return data?.[key] || SITE_IMAGE_DEFAULTS[key];
}
