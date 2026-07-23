declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      empCode: string;
      email: string;
      name: string;
      role: string;
      department: string;
      isAdmin: boolean;
      permissions: any; // EmployeePermissions
    };
  }
}
