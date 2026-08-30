import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly base = `${environment.apiBaseUrl}/uploads`;

  constructor(private readonly http: HttpClient) {}

  /** Uploads a base64 PNG/JPEG data URL (as produced by the signature
   * pad's canvas.toDataURL()) and returns its stored URL. */
  uploadSignature(dataUrl: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.base}/signature`, { dataUrl });
  }
}