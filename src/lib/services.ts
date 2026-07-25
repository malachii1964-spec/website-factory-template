// The 8 services as feature lines under the one brand, grouped into 3 scannable
// buckets (per BRAND.md). Order and copy tuned for a skeptical senior first.

export type Service = {
  id: string;
  name: string;
  blurb: string;
  eg: string;
};

export type ServiceGroup = {
  key: string;
  label: string;
  note: string;
  services: Service[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    key: "everyday",
    label: "Everyday runs",
    note: "The day-to-day pickups and drop-offs.",
    services: [
      {
        id: "local-delivery",
        name: "Local Delivery",
        blurb: "Food, groceries, retail, flowers, hardware — brought to your door.",
        eg: "A hot lunch from downtown, dropped at the office.",
      },
      {
        id: "custom-errands",
        name: "Custom Errands",
        blurb: "Post office, returns and exchanges, and find-it-and-fetch-it requests.",
        eg: "Mail a package, then pick up a part across town.",
      },
      {
        id: "multi-stop",
        name: "Multi-Stop Missions",
        blurb: "Several stops, one order, one price. We map the smart route.",
        eg: "Pharmacy, then the bank, then the grocery — one run.",
      },
      {
        id: "wait-return",
        name: "Wait-and-Return",
        blurb: "We take it for repair or paperwork, wait, and bring it back.",
        eg: "Drop a watch for a battery and return it same day.",
      },
      {
        id: "reservation-runs",
        name: "Reservation Runs",
        blurb: "Lawful, non-restricted purchases picked up and delivered for you.",
        eg: "Grab a pre-ordered pickup you can't get to.",
      },
    ],
  },
  {
    key: "recurring",
    label: "Recurring care",
    note: "Set it once; we handle it like clockwork.",
    services: [
      {
        id: "senior-family",
        name: "Senior & Family Routes",
        blurb: "The same weekly errands, handled dependably — often set up by an out-of-town son or daughter.",
        eg: "Groceries every Tuesday, standing order.",
      },
      {
        id: "seasonal-home",
        name: "Seasonal-Home Concierge",
        blurb: "Fridge stocked, keys handled, the house ready before you arrive at the lake.",
        eg: "Stock the cabin the day before the family drives in.",
      },
    ],
  },
  {
    key: "business",
    label: "For business",
    note: "Your delivery department, without the payroll.",
    services: [
      {
        id: "business-partner",
        name: "Business Delivery Partner",
        blurb: "White-label delivery for restaurants, wineries, farms, retailers, and law offices — your brand on the doorstep.",
        eg: "A winery ships club orders countywide, no van needed.",
      },
    ],
  },
];

export const allServices: Service[] = serviceGroups.flatMap((g) => g.services);
