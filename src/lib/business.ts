// Seller-of-record details for GST tax invoices — from the business's GST
// registration certificate (Form GST REG-06). Update here if the business
// details or registered address ever change.
export const BUSINESS = {
  legalName: "DHANIK GLOBAL LLP",
  gstin: "24AAZFD1808L1Z1",
  addressLines: ["Shop No. 519, 520, The Capital", "Gangotri Circle, SP Ring Road, Nikol"],
  city: "Ahmedabad",
  state: "Gujarat",
  stateCode: "24",
  pincode: "382350",
};

// Dog walking / pet care falls under "other services n.e.c." — standard
// 18% GST rate (no exemption applies to this category).
export const GST_RATE = 0.18;

// GST state codes (first two digits of a GSTIN / used for place-of-supply)
// — only the states/UTs plausible for this business's customers need to
// resolve correctly; anything else still renders, just without a code.
const STATE_CODES: Record<string, string> = {
  "andhra pradesh": "37",
  "arunachal pradesh": "12",
  assam: "18",
  bihar: "10",
  chhattisgarh: "22",
  goa: "30",
  gujarat: "24",
  haryana: "06",
  "himachal pradesh": "02",
  jharkhand: "20",
  karnataka: "29",
  kerala: "32",
  "madhya pradesh": "23",
  maharashtra: "27",
  manipur: "14",
  meghalaya: "17",
  mizoram: "15",
  nagaland: "13",
  odisha: "21",
  punjab: "03",
  rajasthan: "08",
  sikkim: "11",
  "tamil nadu": "33",
  telangana: "36",
  tripura: "16",
  "uttar pradesh": "09",
  uttarakhand: "05",
  "west bengal": "19",
  delhi: "07",
  "jammu and kashmir": "01",
  ladakh: "38",
  chandigarh: "04",
  puducherry: "34",
};

export function stateCodeFor(stateName: string): string | undefined {
  return STATE_CODES[stateName.trim().toLowerCase()];
}

export function isSameStateAsBusiness(stateName: string): boolean {
  return stateName.trim().toLowerCase() === BUSINESS.state.toLowerCase();
}
