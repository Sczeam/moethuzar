import Link from "next/link";
import Container from "@/components/ui/container";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-sepia-border/80 bg-paper-light/70">
      <Container className="grid gap-8 py-10 md:grid-cols-3">
        <div>
          <h2 className="text-2xl font-semibold uppercase tracking-[0.12em] text-ink">
            Moethuzar
          </h2>
          <p className="mt-2 text-sm text-charcoal">
            Vintage-inspired everyday wear. Cash on delivery is available across Myanmar.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-teak-brown">Quick Links</h3>
          <div className="mt-3 grid gap-2 text-sm text-charcoal">
            <Link href="/" className="hover:text-ink">
              Shop
            </Link>
            <Link href="/cart" className="hover:text-ink">
              Cart
            </Link>
            <Link href="/order/track" className="hover:text-ink">
              Track Order
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-teak-brown">Operations</h3>
          <div className="mt-3 grid gap-2 text-sm text-charcoal">
            <p>Support Hours: 9:00 AM - 7:00 PM</p>
            <p>Contact: +95 9 000 000 000</p>
            <Link href="/admin/login" className="hover:text-ink">
              Admin Login
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
