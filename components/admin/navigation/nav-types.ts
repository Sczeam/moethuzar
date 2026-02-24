export type FeatureFlagMap = Record<string, boolean>;

export type AdminNavItemDefinition = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  order: number;
  featureFlag?: string;
};

export type AdminModuleDefinition = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  order: number;
  featureFlag?: string;
  children?: AdminNavItemDefinition[];
};

export type AdminSidebarItem = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
};

export type AdminSidebarGroup = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  children?: AdminSidebarItem[];
};
