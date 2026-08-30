import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, MetalRate } from '../models/api-models';

@Injectable({ providedIn: 'root' })
export class RatesService {
  private readonly base = `${environment.apiBaseUrl}/rates`;

  constructor(private readonly http: HttpClient) {}

  getCurrent(metalCode: string): Observable<MetalRate> {
    return this.http.get<MetalRate>(`${this.base}/current/${metalCode}`);
  }

  setRate(metalCode: string, ratePerGram: string, branchId?: string): Observable<MetalRate> {
    return this.http.post<MetalRate>(this.base, { metalCode, ratePerGram, branchId });
  }

  history(metalCode: string, limit = 50): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/history/${metalCode}`, { params: { limit: String(limit) } });
  }
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly base = `${environment.apiBaseUrl}/reports`;

  constructor(private readonly http: HttpClient) {}

  dashboard(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/dashboard`);
  }

  customerStatement(customerId: string): Observable<unknown> {
    return this.http.get(`${this.base}/customer-statement/${customerId}`);
  }
}
