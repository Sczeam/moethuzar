import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/constants/legal";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated={LEGAL_LAST_UPDATED_LABEL}
      intro={
        <>
          <p>
            These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of this website and any purchases made
            through it. By accessing or using this website, you agree to be bound by these Terms.
          </p>
          <p>If you do not agree, please do not use the website.</p>
        </>
      }
      sections={[
        {
          title: "1) About Us",
          content: (
            <>
              <p>This website is operated by Moethuzar Ready to Wear (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).</p>
              <p>Business location: Myanmar</p>
              <p>Contact email: [your email]</p>
              <p>Contact phone (optional): [your phone]</p>
              <p>Business address (optional but recommended): [address]</p>
            </>
          ),
        },
        {
          title: "2) Eligibility & Account",
          content: (
            <>
              <p>You must be at least 18 years old (or have permission from a parent/guardian) to place an order.</p>
              <p>If you create an account, you&rsquo;re responsible for keeping your login details secure.</p>
              <p>
                We may suspend or terminate accounts that we suspect are used for fraud, abuse, or violations of
                these Terms.
              </p>
            </>
          ),
        },
        {
          title: "3) Products & Availability",
          content: (
            <>
              <p>We sell clothing and related products.</p>
              <p>
                Product images are for illustration; colours may vary due to lighting, screen settings, and production
                batches.
              </p>
              <p>Sizes may vary slightly due to manufacturing tolerances.</p>
              <p>All products are subject to availability. We may limit quantities or discontinue products at any time.</p>
            </>
          ),
        },
        {
          title: "4) Pricing",
          content: (
            <>
              <p>Prices are shown in MMK and may change without notice.</p>
              <p>
                Any shipping fees, taxes, or duties (if applicable) will be shown at checkout or communicated before
                confirming your order.
              </p>
              <p>If we discover a pricing error, we may cancel the order and refund you.</p>
            </>
          ),
        },
        {
          title: "5) Orders & Acceptance",
          content: (
            <>
              <p>When you place an order, you are making an offer to purchase.</p>
              <p>Your order is accepted when we confirm it (e.g., by order confirmation screen).</p>
              <p>
                We reserve the right to refuse or cancel orders, including suspected fraud, incorrect pricing,
                inventory issues, or delivery limitations.
              </p>
            </>
          ),
        },
        {
          title: "6) Payments",
          content: (
            <>
              <p>We currently accept Cash on Delivery (COD) for orders.</p>
              <p>Payments must be completed before dispatch for non-COD methods if introduced in future.</p>
              <p>If a payment fails or is reversed, we may cancel the order.</p>
            </>
          ),
        },
        {
          title: "7) Shipping & Delivery",
          content: (
            <>
              <p>We aim to dispatch orders within [X] business days after order confirmation.</p>
              <p>
                Delivery times are estimates and may vary due to courier delays, weather, holidays, customs, or other
                factors.
              </p>
              <p>Risk of loss passes to you upon delivery to the shipping address provided.</p>
              <p>
                You are responsible for providing accurate delivery details. If a parcel is returned due to incorrect
                details, re-shipping fees may apply.
              </p>
            </>
          ),
        },
        {
          title: "8) Returns, Exchanges & Refunds",
          content: (
            <>
              <p>Returns/exchanges are accepted within [X] days of delivery.</p>
              <p>Items must be unused, unwashed, unworn, with original tags and packaging.</p>
              <p>Common non-returnable items include sale items, underwear/intimates, custom items, and gift cards.</p>
              <p>
                Approved refunds are issued to the original payment method where possible. Shipping fees are
                non-refundable unless the item is faulty or we made an error.
              </p>
              <p>
                For faulty/incorrect items, contact us within [48 hours / 7 days] of delivery with photos and your
                order number.
              </p>
              <p>Return requests: Email [your email] with order number, item(s), reason, and photos if faulty.</p>
            </>
          ),
        },
        {
          title: "9) Pre-orders (If You Offer Them)",
          content: (
            <>
              <p>Pre-order dispatch dates are estimates.</p>
              <p>If production delays occur, we will notify you.</p>
              <p>Pre-orders may be non-refundable after a certain stage [optional].</p>
            </>
          ),
        },
        {
          title: "10) Promotions & Discount Codes",
          content: (
            <>
              <p>Promo codes can&rsquo;t be combined unless stated.</p>
              <p>We may withdraw promotions at any time.</p>
              <p>If we suspect misuse, we may cancel discounted orders.</p>
            </>
          ),
        },
        {
          title: "11) Intellectual Property",
          content: (
            <p>
              All content on this website (logos, branding, photos, product descriptions, designs, graphics, text) is
              owned by or licensed to us. You may not copy, reproduce, distribute, or exploit any content without
              written permission.
            </p>
          ),
        },
        {
          title: "12) Acceptable Use",
          content: (
            <>
              <p>You agree not to use the site for unlawful purposes.</p>
              <p>You agree not to hack, disrupt, overload the website, upload malware, scrape data, or impersonate others.</p>
            </>
          ),
        },
        {
          title: "13) Reviews, Comments & User Content",
          content: (
            <>
              <p>
                If you submit reviews or comments, you confirm they are truthful and do not violate laws or third-party
                rights.
              </p>
              <p>
                You grant us a worldwide, royalty-free license to use and display your content for marketing and
                website purposes.
              </p>
              <p>We may remove content considered offensive, misleading, or inappropriate.</p>
            </>
          ),
        },
        {
          title: "14) Third-Party Links",
          content: (
            <p>
              This website may include links to third-party sites (e.g., courier tracking, payment providers, social
              media). We are not responsible for their content, policies, or services.
            </p>
          ),
        },
        {
          title: "15) Disclaimers",
          content: (
            <>
              <p>We provide the website &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</p>
              <p>We do not guarantee the website will always be secure, error-free, or uninterrupted.</p>
              <p>
                To the fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a
                particular purpose, and non-infringement.
              </p>
            </>
          ),
        },
        {
          title: "16) Limitation of Liability",
          content: (
            <>
              <p>
                To the maximum extent allowed by law, we are not liable for indirect, incidental, special, or
                consequential damages.
              </p>
              <p>Our total liability for any claim related to an order will not exceed the amount you paid for that order.</p>
            </>
          ),
        },
        {
          title: "17) Indemnity",
          content: (
            <p>
              You agree to indemnify and hold us harmless from any claims, damages, and expenses (including legal fees)
              arising from your breach of these Terms or misuse of the website.
            </p>
          ),
        },
        {
          title: "18) Force Majeure",
          content: (
            <p>
              We are not responsible for delays or failures caused by events beyond our control (e.g., natural
              disasters, war, strikes, government actions, internet outages, courier disruption).
            </p>
          ),
        },
        {
          title: "19) Governing Law & Disputes",
          content: (
            <>
              <p>These Terms are governed by the laws of Myanmar.</p>
              <p>
                Any disputes should first be attempted to resolve informally by contacting us at [your email]. If
                unresolved, disputes will be subject to the courts of [City/Region], Myanmar.
              </p>
            </>
          ),
        },
        {
          title: "20) Changes to These Terms",
          content: (
            <p>
              We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date will change accordingly.
              Continued use of the website means you accept the updated Terms.
            </p>
          ),
        },
        {
          title: "21) Contact Us",
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
