import { listActiveProducts } from "@/server/services/product.service";
import { NextResponse } from "next/server";

type ActiveProduct = Awaited<ReturnType<typeof listActiveProducts>>[number];
type ActiveProductVariant = ActiveProduct["variants"][number];

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

export async function GET() {
  try {
    const products = await listActiveProducts();
    return NextResponse.json(
      {
        ok: true,
        products: products.map((product: ActiveProduct) => ({
          ...product,
          price: toPriceString(product.price),
          variants: product.variants.map((variant: ActiveProductVariant) => ({
            ...variant,
            price: variant.price ? toPriceString(variant.price) : null,
            compareAtPrice: variant.compareAtPrice
              ? toPriceString(variant.compareAtPrice)
              : null,
          })),
        })),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
