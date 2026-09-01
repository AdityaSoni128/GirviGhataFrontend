import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, PaginatedResult } from '../models/api-models';

export interface CreateCustomerPayload {
  fullName: string;
  guardianName?: string;
  mobile?: string;
  altMobile?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  branchId?: string;
  aadhaarNumber?: string;
  panNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly base = `${environment.apiBaseUrl}/customers`;

  constructor(private readonly http: HttpClient) {}

  search(q: string, page = 1, pageSize = 25): Observable<PaginatedResult<Customer>> {
    return this.http.get<PaginatedResult<Customer>>(this.base, {
      params: { q, page: String(page), pageSize: String(pageSize) },
    });
  }

  getById(id: string, unmaskKyc = false): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/${id}`, {
      params: unmaskKyc ? { unmaskKyc: 'true' } : {},
    });
  }

  create(payload: CreateCustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateCustomerPayload>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.base}/${id}`, payload);
  }
}
