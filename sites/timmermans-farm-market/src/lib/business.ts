// Single source of truth for every fact about the business that appears on
// the site — the address in the footer, the map embed, the JSON-LD, and the
// phone link must never drift from each other.

export const business = {
  name: "Timmerman's Farm and Market",
  shortName: "Timmerman's",
  phone: "716-326-3280",
  phoneHref: "tel:+17163263280",
  email: undefined as string | undefined,
  address: {
    street: "8352 Route 20 West",
    city: "Westfield",
    state: "NY",
    zip: "14787",
  },
  get addressLine() {
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zip}`;
  },
  mapsQuery: "Timmerman's Farm and Market, 8352 Route 20 West, Westfield, NY 14787",
  // Approximate coordinates for Route 20 W at this stretch of Westfield, NY —
  // used only for the map embed pin, not claimed as surveyed.
  coordinates: { lat: 42.3298, lng: -79.5966 },
} as const;

// Open 7 days a week, 9am-6pm, during the market's June-October season —
// per the business's own 2026 season-opening announcement.
export const hours = {
  open: { hour: 9, minute: 0 },
  close: { hour: 18, minute: 0 },
  daysOpen: [0, 1, 2, 3, 4, 5, 6] as const, // every day
  seasonStartMonth: 6, // June
  seasonEndMonth: 10, // October
} as const;

export const hoursDisplay = "9:00 AM – 6:00 PM, seven days a week";
export const seasonDisplay = "June through October";
