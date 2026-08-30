import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Branch {
  id: string;
  code: string;
  name: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Array<{ permission: Permission }>;
}

export interface TenantUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: Array<{ role: Role }>;
  branches: Array<{ branch: Branch }>;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  roleIds: string[];
  branchIds: string[];
}

export interface CreateRolePayload {
  name: string;
  permissionCodes: string[];
}

export interface CreateBranchPayload {
  code: string;
  name: string;
  city?: string;
  state?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly base = `${environment.apiBaseUrl}/tenants`;

  constructor(private readonly http: HttpClient) {}

  listBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.base}/branches`);
  }

  createBranch(payload: CreateBranchPayload): Observable<Branch> {
    return this.http.post<Branch>(`${this.base}/branches`, payload);
  }

  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}/roles`);
  }

  createRole(payload: CreateRolePayload): Observable<Role> {
    return this.http.post<Role>(`${this.base}/roles`, payload);
  }

  listPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.base}/permissions`);
  }

  listUsers(): Observable<TenantUser[]> {
    return this.http.get<TenantUser[]>(`${this.base}/users`);
  }

  createUser(payload: CreateUserPayload): Observable<TenantUser> {
    return this.http.post<TenantUser>(`${this.base}/users`, payload);
  }

  deactivateUser(userId: string): Observable<TenantUser> {
    return this.http.patch<TenantUser>(`${this.base}/users/${userId}/deactivate`, {});
  }
}
