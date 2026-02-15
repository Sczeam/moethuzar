import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/constants/legal";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <p>
          This Privacy Policy explains what information we collect, how we use it, and what rights you have when
          using Moethuzar Ready to Wear.
        </p>
      }
      sections={[
        {
          title: "Information We Collect",
          content: (
            <>
              <p>Order details: name, phone number, email (optional), and shipping address.</p>
              <p>Order metadata: items ordered, pricing, timestamps, and order status history.</p>
              <p>Technical data: basic logs such as request id, route errors, and security events.</p>
            </>
          ),
        },
        {
          title: "How We Use Information",
          content: (
            <>
              <p>To process and deliver your orders.</p>
              <p>To contact you for order confirmation and support.</p>
              <p>To prevent fraud and secure the website.</p>
            </>
          ),
        },
        {
          title: "Data Sharing",
          content: (
            <p>
              We share data only when needed to run operations (e.g., delivery services, hosting providers, database
              providers). We do not sell your personal information.
            </p>
          ),
        },
        {
          title: "Data Retention",
          content: (
            <p>
              We retain order and operational records as needed for customer support, legal compliance, and audit
              needs.
            </p>
          ),
        },
        {
          title: "Your Rights",
          content: (
            <>
              <p>You may request access, correction, or deletion of your personal data where applicable.</p>
              <p>Contact us at [your email] for privacy requests.</p>
            </>
          ),
        },
        {
          title: "Contact",
          content: (
            <>
              <p>Email: [your email]</p>
              <p>Phone: [your phone] (optional)</p>
              <p>Address: [your address] (optional)</p>
            </>
          ),
        },
      ]}
    />
  );
}
