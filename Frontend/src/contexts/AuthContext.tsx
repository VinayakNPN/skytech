'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface ModulePermission {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface EmployeePermissions {
  dashboard: ModulePermission;
  inquiries: ModulePermission;
  wbs: ModulePermission;
  inventory: ModulePermission;
  employees: ModulePermission;
  employeeHub: ModulePermission;
  reports: ModulePermission;
  leaveApproval: { canApprove: boolean };
}

export interface AuthUser {
  id: string;
  empCode: string;
  email: string;
  name: string;
  role: string;
  department: string;
  isAdmin: boolean;
  permissions: EmployeePermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  can: (module: keyof EmployeePermissions, action: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch current user if token exists (browser cookies handle token automatically for fetch, or we pass it)
    const fetchMe = async () => {
      const token = getCookie('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token invalid or missing
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = (token: string, userData: AuthUser) => {
    // Set cookie for middleware
    document.cookie = `token=${token}; path=/; max-age=28800; samesite=lax`;
    setUser(userData);
    if (userData.isAdmin) {
      router.push('/');
    } else {
      router.push('/employee-management');
    }
  };

  const logout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
    router.push('/login');
  };

  const can = (module: keyof EmployeePermissions, action: 'read' | 'write' | 'delete') => {
    if (!user || user.isAdmin) return true;
    let permissions: any = user.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = {};
      }
    }
    const modulePerms = permissions?.[module];
    if (!modulePerms) return false;
    return (modulePerms as any)[action] === true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper for client-side cookies
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
