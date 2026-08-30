import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CurrentValuationResponse,
  GirviTopUp,
  GirviTransaction,
  PaginatedResult,
  PledgedItemInput,
} from '../models/api-models';

export interface CreateGirviPayload {
  customerId: string;
  branchId: string;
  items: PledgedItemInput[];
  requestedLoanAmount: string;
  pledgeDate?: string;
  customerSignatureUrl?: string;
  /** Owner-chosen interest rate (%) for this specific Girvi. Optional —
   * server defaults to the active rule's rate when omitted. */
  interestPercent?: string;
}

export interface CreateTopUpPayload {
  amount: string;
  topUpDate?: string;
  applyPreviousInterestStartDate: boolean;
}

@Injectable({ providedIn: 'root' })
export class GirviService {
  private readonly base = `${environment.apiBaseUrl}/girvi`;

  constructor(private readonly http: HttpClient) {}

  create(payload: CreateGirviPayload): Observable<GirviTransaction> {
    return this.http.post<GirviTransaction>(this.base, payload);
  }

  getById(id: string): Observable<GirviTransaction> {
    return this.http.get<GirviTransaction>(`${this.base}/${id}`);
  }

  list(status?: string, page = 1, pageSize = 25): Observable<PaginatedResult<GirviTransaction>> {
    return this.http.get<PaginatedResult<GirviTransaction>>(this.base, {
      params: {
        ...(status ? { status } : {}),
        page: String(page),
        pageSize: String(pageSize),
      },
    });
  }

  topUp(id: string, payload: CreateTopUpPayload): Observable<GirviTopUp> {
    return this.http.post<GirviTopUp>(`${this.base}/${id}/topup`, payload);
  }

  getCurrentValuation(id: string): Observable<CurrentValuationResponse> {
    return this.http.get<CurrentValuationResponse>(`${this.base}/${id}/current-valuation`);
  }
}