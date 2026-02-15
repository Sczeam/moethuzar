import { z } from "zod";

const queryStringSchema = z.string().trim().max(120).default("");
const optionalStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .optional();

export const searchSortValues = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
] as const;

export const searchProductsQuerySchema = z
  .object({
    q: queryStringSchema,
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
    sort: z.enum(searchSortValues).default("relevance"),
    category: optionalStringSchema,
    color: optionalStringSchema,
    size: optionalStringSchema,
    inStock: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    minPrice: z.coerce.number().min(0).max(100000000).optional(),
    maxPrice: z.coerce.number().min(0).max(100000000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.minPrice === "number" &&
      typeof data.maxPrice === "number" &&
      data.minPrice > data.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message: "maxPrice must be greater than or equal to minPrice.",
      });
    }
  });

export type SearchProductsQueryInput = z.infer<typeof searchProductsQuerySchema>;
