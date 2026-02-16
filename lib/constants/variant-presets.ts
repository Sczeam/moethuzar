export type VariantPreset = {
  id: string;
  name: string;
  namePrefix: string;
  skuPrefix: string;
  material: string;
  colors: string[];
  sizes: string[];
};

export const variantPresets: VariantPreset[] = [
  {
    id: "dress-core",
    name: "Dress Core (MM)",
    namePrefix: "Moethuzar Dress",
    skuPrefix: "MZT-DRESS",
    material: "Cotton Blend",
    colors: ["Ivory", "Rose", "Sand", "Navy"],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    id: "blouse-core",
    name: "Blouse Core (MM)",
    namePrefix: "Moethuzar Blouse",
    skuPrefix: "MZT-BLOUSE",
    material: "Linen Blend",
    colors: ["Ivory", "Black", "Pink", "Red"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "set-core",
    name: "Set Core (MM)",
    namePrefix: "Moethuzar Set",
    skuPrefix: "MZT-SET",
    material: "Tweed",
    colors: ["Ivory", "Sand", "Blue"],
    sizes: ["S", "M", "L"],
  },
];
