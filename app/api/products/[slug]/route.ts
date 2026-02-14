import { getActiveProductBySlug } from "@/server/services/product.service";
import { NextResponse } from "next/server";

type ActiveProduct = NonNullable<Awaited<ReturnType<typeof getActiveProductBySlug>>>;
type ActiveProductVariant = ActiveProduct["variants"][number];

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await getActiveProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        product: {
          ...product,
          price: toPriceString(product.price),
          variants: product.variants.map((variant: ActiveProductVariant) => ({
            ...variant,
            price: variant.price ? toPriceString(variant.price) : null,
            compareAtPrice: variant.compareAtPrice
              ? toPriceString(variant.compareAtPrice)
              : null,
          })),
        },
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
