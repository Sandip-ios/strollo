import { GST_RATE, isSameStateAsBusiness } from "@/lib/business";

export type GstBreakdown = {
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  isInterState: boolean;
};

// The amount actually charged (`totalPaise`) is GST-inclusive — it's what
// was paid via Razorpay and can't be retroactively changed, so the tax
// breakdown is derived backward from it rather than added on top.
// Intra-state (customer in the same state as the business) splits the tax
// into CGST + SGST; inter-state uses IGST — standard GST mechanics.
export function computeGstBreakdown(totalPaise: number, customerState: string): GstBreakdown {
  const taxableValuePaise = Math.round(totalPaise / (1 + GST_RATE));
  const totalTaxPaise = totalPaise - taxableValuePaise;
  const isInterState = !isSameStateAsBusiness(customerState);

  if (isInterState) {
    return { taxableValuePaise, cgstPaise: 0, sgstPaise: 0, igstPaise: totalTaxPaise, isInterState };
  }

  const cgstPaise = Math.round(totalTaxPaise / 2);
  const sgstPaise = totalTaxPaise - cgstPaise;
  return { taxableValuePaise, cgstPaise, sgstPaise, igstPaise: 0, isInterState };
}
