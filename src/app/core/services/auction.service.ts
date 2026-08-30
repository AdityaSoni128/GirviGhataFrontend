import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly base = `${environment.apiBaseUrl}/auctions`;

  constructor(private readonly http: HttpClient) {}

  sendNotice(girviTransactionId: string): Observable<unknown> {
    return this.http.post(`${this.base}/${girviTransactionId}/notice`, {});
  }

  markEligible(girviTransactionId: string, reservePrice?: string): Observable<unknown> {
    return this.http.post(`${this.base}/${girviTransactionId}/eligible`, { reservePrice });
  }

  schedule(girviTransactionId: string, scheduledAt: string): Observable<unknown> {
    return this.http.post(`${this.base}/${girviTransactionId}/schedule`, { scheduledAt });
  }

  recordSale(girviTransactionId: string, finalSaleAmount: string, buyerName: string): Observable<unknown> {
    return this.http.post(`${this.base}/${girviTransactionId}/sale`, { finalSaleAmount, buyerName });
  }

  close(girviTransactionId: string): Observable<unknown> {
    return this.http.post(`${this.base}/${girviTransactionId}/close`, {});
  }
}
