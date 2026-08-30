import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BusinessRuleSet {
  id: string;
  metalCode: string;
  version: number;
  isActive: boolean;
  eligibilityPercent: string;
  marginType: 'FIXED' | 'PERCENT' | 'NONE';
  marginValue: string;
  interestMethod: 'FLAT_MONTHLY' | 'DAILY' | 'REDUCING_BALANCE';
  interestPercent: string;
  gracePeriodDays: number;
  roundingRule: 'NONE' | 'ROUND_NEAREST_1' | 'ROUND_NEAREST_10';
  paymentAllocationOrder: string[];
}

export interface CreateRuleSetPayload {
  metalCode: string;
  eligibilityPercent: string;
  marginType: 'FIXED' | 'PERCENT' | 'NONE';
  marginValue: string;
  interestMethod: 'FLAT_MONTHLY' | 'DAILY' | 'REDUCING_BALANCE';
  interestPercent: string;
  gracePeriodDays: number;
  roundingRule: 'NONE' | 'ROUND_NEAREST_1' | 'ROUND_NEAREST_10';
  paymentAllocationOrder: string[];
}

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly base = `${environment.apiBaseUrl}/rules`;

  constructor(private readonly http: HttpClient) {}

  listVersions(metalCode: string): Observable<BusinessRuleSet[]> {
    return this.http.get<BusinessRuleSet[]>(`${this.base}/${metalCode}`);
  }

  /**
   * Returns the currently ACTIVE rule set for a metal, or `null` if none
   * is configured yet — never throws and never falls back to a
   * hardcoded value; callers must handle `null` explicitly (loading
   * state / blocked calculation / error message), per the "DB is the
   * single source of truth" requirement. Reuses the existing
   * GET /rules/:metalCode endpoint rather than adding a new one — the
   * backend already returns every version including `isActive`.
   */
  getActiveVersion(metalCode: string): Observable<BusinessRuleSet | null> {
    return this.listVersions(metalCode).pipe(map((versions) => versions.find((v) => v.isActive) ?? null));
  }

  createNewVersion(payload: CreateRuleSetPayload): Observable<BusinessRuleSet> {
    return this.http.post<BusinessRuleSet>(this.base, payload);
  }
}