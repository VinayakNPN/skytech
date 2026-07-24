export function determineLeaveRoutingRole(applicantRole: string): string {
  switch (applicantRole) {
    case 'Manager':
      return 'Admin';
    case 'HR':
      return 'Manager';
    case 'Engineer':
    case 'Supervisor':
    case 'Operator':
    case 'Viewer':
    default:
      return 'HR';
  }
}
