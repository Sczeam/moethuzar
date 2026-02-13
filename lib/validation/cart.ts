import { z } from "zod";

const uuid = z.string().uuid();

export const addCartItemSchema = z.object({
  variantId: uuid,
  quantity: z.int().min(1).max(20),
});

export const setCartItemQuantitySchema = z.object({
  variantId: uuid,
  quantity: z.int().min(0).max(20),
});

export const removeCartItemSchema = z.object({
  variantId: uuid,
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type SetCartItemQuantityInput = z.infer<typeof setCartItemQuantitySchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
