import { redirect } from "next/navigation";
import { getCustomerSessionUser } from "@/server/auth/customer";
import { listAccountOrders } from "@/server/services/account-orders.service";
import OrdersClient from "./orders-client";

const ACCOUNT_ORDERS_PAGE_SIZE = 20;

export default async function AccountOrdersPage() {
  const sessionUser = await getCustomerSessionUser();
  if (!sessionUser) {
    redirect("/account/login?next=/account/orders");
  }

  const initial = await listAccountOrders({
    customerId: sessionUser.id,
    pageSize: ACCOUNT_ORDERS_PAGE_SIZE,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <OrdersClient
        initialOrders={initial.orders}
        initialNextCursor={initial.nextCursor}
        pageSize={initial.pageSize}
      />
    </main>
  );
}

