// Public-facing contact/social details shown on the marketing site (footer,
// Contact Us page). Distinct from BUSINESS in business.ts, which holds the
// legal GST-registered seller details used only on tax invoices.
export const CONTACT = {
  address: {
    line1: "520, The Capital",
    line2: "Near Nikol Police Station, Nikol",
    city: "Ahmedabad",
    pincode: "382350",
  },
  phones: ["8866807262", "9909949254"],
  whatsappNumber: "8866807262",
  email: "contact@strollo.com",
  // Fill in real profile URLs to have the icon appear in the footer.
  social: {
    instagram: "https://www.instagram.com/dogloversclub_nikol/",
  } as Partial<Record<"instagram" | "facebook" | "twitter" | "youtube" | "linkedin", string>>,
};

export function whatsappUrl(): string {
  return `https://wa.me/91${CONTACT.whatsappNumber}`;
}

export function addressOneLine(): string {
  const { line1, line2, city, pincode } = CONTACT.address;
  return `${line1}, ${line2}, ${city} ${pincode}`;
}

export function googleMapsSearchUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOneLine())}`;
}
