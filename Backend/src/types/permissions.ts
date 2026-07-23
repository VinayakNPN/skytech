export interface ModulePermission {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface EmployeePermissions {
  dashboard:       ModulePermission;
  inquiries:       ModulePermission;
  wbs:             ModulePermission;
  inventory:       ModulePermission;
  employees:       ModulePermission;
  employeeHub:     ModulePermission;
  reports:         ModulePermission;
  leaveApproval:   { canApprove: boolean };
}
