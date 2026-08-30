import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OutstandingSummary, Payment } from '../models/api-models';

export interface CreatePaymentPayload {
  girviTransactionId: string;
  amount: string;
  mode: 'CASH' | 'UPI' | 'BANK' | 'OTHER';
  referenceNumber?: string;
  notes?: string;
  /** Actual date the payment was received (yyyy-MM-dd). Optional —
   * server defaults to today when omitted. */
  paymentDate?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly base = `${environment.apiBaseUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  getOutstanding(girviTransactionId: string): Observable<OutstandingSummary> {
    return this.http.get<OutstandingSummary>(`${this.base}/outstanding/${girviTransactionId}`);
  }

  receive(payload: CreatePaymentPayload): Observable<Payment> {
    return this.http.post<Payment>(this.base, payload);
  }

  reverse(paymentId: string, reason: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/${paymentId}/reverse`, { reason });
  }
}

@Injectable({ providedIn: 'root' })
export class RedemptionService {
  private readonly base = `${environment.apiBaseUrl}/redemptions`;

  constructor(private readonly http: HttpClient) {}

  redeem(girviTransactionId: string, customerAckUrl?: string): Observable<unknown> {
    return this.http.post(this.base, { girviTransactionId, customerAckUrl });
  }
}