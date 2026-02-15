import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/constants/legal";

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns & Exchange Policy"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      sections={[
        {
          title: "Eligibility",
          content: (
            <>
              <p>Returns and exchanges are accepted within [X] days of delivery.</p>
              <p>Items must be unused, unwashed, unworn, and include original tags and packaging.</p>
            </>
          ),
        },
        {
          title: "Non-Returnable Items",
          content: (
            <>
              <p>Sale/discounted items (if marked final sale).</p>
              <p>Underwear/intimates (for hygiene reasons).</p>
              <p>Custom-made or altered items.</p>
            </>
          ),
        },
        {
          title: "Faulty or Incorrect Items",
          content: (
            <p>
              If you receive a damaged, defective, or incorrect item, contact us within [48 hours / 7 days] with
              photos and your order number.
            </p>
          ),
        },
        {
          title: "Refunds",
          content: (
            <>
              <p>Approved refunds are issued to the original payment method where possible.</p>
              <p>Shipping fees are non-refundable unless the item is faulty or we made an error.</p>
            </>
          ),
        },
        {
          title: "How to Request a Return",
          content: (
            <>
              <p>Email: [your email]</p>
              <p>Include order number, item(s), reason, and photos (if faulty).</p>
            </>
          ),
        },
      ]}
    />
  );
}
