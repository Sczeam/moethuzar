import type {
  AdminModuleDefinition,
  AdminNavItemDefinition,
  AdminSidebarGroup,
  FeatureFlagMap,
} from "@/components/admin/navigation/nav-types";

type BuildAdminSidebarGroupsArgs = {
  modules: AdminModuleDefinition[];
  featureFlags?: FeatureFlagMap;
};

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function isFlagEnabled(featureFlag: string | undefined, featureFlags: FeatureFlagMap): boolean {
  if (!featureFlag) {
    return true;
  }
  return featureFlags[featureFlag] === true;
}

function mapChildren(
  children: AdminNavItemDefinition[] | undefined,
  featureFlags: FeatureFlagMap,
): AdminSidebarGroup["children"] {
  if (!children?.length) {
    return undefined;
  }

  return sortByOrder(children)
    .filter((item) => isFlagEnabled(item.featureFlag, featureFlags))
    .map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      disabled: item.disabled ?? false,
    }));
}

export function buildAdminSidebarGroups({
  modules,
  featureFlags = {},
}: BuildAdminSidebarGroupsArgs): AdminSidebarGroup[] {
  return sortByOrder(modules)
    .filter((module) => isFlagEnabled(module.featureFlag, featureFlags))
    .map((module) => ({
      id: module.id,
      label: module.label,
      href: module.href,
      disabled: module.disabled ?? false,
      children: mapChildren(module.children, featureFlags),
    }));
}
