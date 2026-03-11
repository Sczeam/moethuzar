import { redirect } from "next/navigation";
import { DEFAULT_WISHLIST_PAGE_SIZE } from "@/lib/constants/wishlist";
import { getCustomerSessionUser } from "@/server/auth/customer";
import { listWishlistItems } from "@/server/services/wishlist-read.service";
import { WishlistList } from "@/features/storefront/wishlist/components/wishlist-list";

export default async function AccountWishlistPage() {
  const sessionUser = await getCustomerSessionUser();
  if (!sessionUser) {
    redirect("/account/login?next=/account/wishlist");
  }

  const initial = await listWishlistItems({
    identity: {
      kind: "customer",
      customerId: sessionUser.customerId,
    },
    pageSize: DEFAULT_WISHLIST_PAGE_SIZE,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <WishlistList initialItems={initial.items} initialNextCursor={initial.nextCursor} />
    </main>
  );
}
