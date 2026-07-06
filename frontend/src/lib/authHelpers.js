const DEVICE_ID_KEY = "ps_device_id";

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** @param {string} role */
export function getDashboardPath(role) {
  switch (role) {
    case "super_admin":
      return "/super-admin";
    case "org_admin":
      return "/admin";
    case "client":
      return "/portal";
    case "team_member":
      return "/member";
    case "project_manager":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
