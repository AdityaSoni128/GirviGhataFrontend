import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Hand-rolled signature canvas using the Pointer Events API — works
 * uniformly for mouse, touch, and stylus without pulling in a dedicated
 * signature-pad dependency (the project avoids adding UI libraries for
 * things this simple to implement directly).
 *
 * Emits `signatureChange` with a base64 PNG data URL after each
 * completed stroke, and with `null` when cleared. The parent component
 * owns whatever it does with that data URL (e.g. holding onto it across
 * form validation failures, uploading it on submit) — this component has
 * no knowledge of forms, uploads, or persistence.
 */
@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-2 border-dashed border-gray-300 rounded-md bg-white overflow-hidden">
      <canvas
        #canvas
        class="w-full touch-none select-none cursor-crosshair block"
        style="height: 180px;"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointerleave)="onPointerUp()"
        (pointercancel)="onPointerUp()"
      ></canvas>
    </div>
    @if (isEmpty) {
      <p class="text-xs text-gray-400 mt-1 text-center">Sign here</p>
    }
    <div class="flex justify-end mt-2">
      <button type="button" (click)="clear()" class="text-xs text-red-600 hover:underline" [disabled]="isEmpty">
        Clear Signature
      </button>
    </div>
  `,
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureChange = new EventEmitter<string | null>();

  isEmpty = true;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    // Size the backing pixel buffer to the element's actual rendered
    // width (responsive) at devicePixelRatio for crisp strokes, while the
    // CSS width stays 100% via the template's `w-full` class — this is
    // what keeps the pad from ever overflowing its container on mobile.
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f1a17';
    this.ctx = ctx;
  }

  onPointerDown(event: PointerEvent): void {
    event.preventDefault(); // stops the page from scrolling while signing on touch devices
    this.drawing = true;
    const pos = this.getPos(event);
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing) return;
    event.preventDefault();
    const pos = this.getPos(event);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.isEmpty = false;
  }

  onPointerUp(): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (!this.isEmpty) {
      this.signatureChange.emit(this.canvasRef.nativeElement.toDataURL('image/png'));
    }
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.isEmpty = true;
    this.signatureChange.emit(null);
  }

  private getPos(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}