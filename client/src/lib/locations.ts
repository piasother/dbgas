// DB Gas sites — used by the Contact section and the footer.
// The same addresses and hours are also in server/seo.ts (what Google reads);
// change both when a site moves or its hours change.

export interface Location {
  icon: string;
  label: string;
  sub: string;
  lines: string[];
  mapQuery: string;
  hours: string;
}

export const LOCATIONS: Location[] = [
  {
    icon: 'fas fa-warehouse',
    label: 'Head Office',
    sub: 'Wholesale & Retail LPG Sales',
    lines: ['Stand 15002', 'Donnington West', 'Bulawayo'],
    mapQuery: 'Stand 15002 Donnington West Bulawayo Zimbabwe',
    hours: 'Mon–Fri 8AM–6PM · Sun 8AM–1PM · Closed Saturday',
  },
  {
    icon: 'fas fa-store',
    label: 'Retail LPG Sales',
    sub: 'Glengarry',
    lines: ['16a Glengarry, Harare Road', 'Bulawayo'],
    mapQuery: '16a Glengarry Harare Road Bulawayo Zimbabwe',
    hours: 'Mon–Fri 8AM–6PM · Sun 8AM–1PM · Closed Saturday',
  },
  {
    icon: 'fas fa-tools',
    label: 'Accessories, Reticulation & Delivery Bookings',
    sub: 'Drew Bulle (Pvt) Ltd',
    lines: ['Unit H23, ZITF', 'Hillside Road', 'Bulawayo'],
    mapQuery: 'ZITF Hillside Road Bulawayo Zimbabwe',
    hours: 'Mon–Fri 8AM–6PM · Closed Saturday & Sunday',
  },
];

export const PHONE = '+263713314920';
export const PHONE_DISPLAY = '071 331 4920';
export const WHATSAPP_URL = 'https://wa.me/263713314920';
export const EMAIL = 'accounts@drewbulle.co.zw';

export function mapUrl(query: string) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}
