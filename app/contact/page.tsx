import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/constants/legal";

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={<p>For order support, returns, exchanges, and business questions, contact us using the details below.</p>}
      sections={[
        {
          title: "Customer Support",
          content: (
            <>
              <p>Email: moethuzar@gmail.com</p>
              <p>Phone: +959777541818</p>
              <p>Support hours: 9:00 AM - 7:00 PM (Myanmar time)</p>
            </>
          ),
        },
        {
          title: "Business Address",
          content: <p>11 Mingalar Street, Baukhtaw, Yankin, Yangon, Myanmar</p>,
        },
      ]}
    />
  );
}
