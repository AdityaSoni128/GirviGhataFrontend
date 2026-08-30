import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Metal, Purity } from '../models/api-models';

export interface MetalWithPurities extends Metal {
  purities: Purity[];
}

@Injectable({ providedIn: 'root' })
export class MetalsService {
  private readonly base = `${environment.apiBaseUrl}/metals`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<MetalWithPurities[]> {
    return this.http.get<MetalWithPurities[]>(this.base);
  }
}
