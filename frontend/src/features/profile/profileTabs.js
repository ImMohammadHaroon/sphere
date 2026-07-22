const BASE_TABS = [
  { value: "profile", label: "Profile" },
  { value: "password", label: "Password" },
  { value: "security", label: "Security" },
];

const ORG_ADMIN_TABS = [
  { value: "organization", label: "Organization" },
  { value: "kanban", label: "Kanban templates" },
  { value: "danger", label: "Danger zone" },
];

export function getProfileTabs(role) {
  if (role === "org_admin") {
    return [...BASE_TABS, ...ORG_ADMIN_TABS];
  }
  return BASE_TABS;
}

export function isValidProfileTab(role, tab) {
  return getProfileTabs(role).some((item) => item.value === tab);
}

export const DEFAULT_PROFILE_TAB = "profile";
