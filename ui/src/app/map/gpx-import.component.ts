import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-gpx-import',
  imports: [NgIf],
  template: `
    <div class="import-container">
      <input
        #fileInput
        type="file"
        accept=".gpx"
        class="hidden-input"
        (change)="onFileChange($event)"
      />
      <button class="import-btn" (click)="fileInput.click()">GPX importieren</button>
      <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  `,
  styles: [
    `
      .import-container {
        padding: 1rem 1.25rem;
      }

      .hidden-input {
        display: none;
      }

      .import-btn {
        width: 100%;
        padding: 0.625rem 1rem;
        background: #3b82f6;
        color: #fff;
        border: none;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s ease;

        &:hover {
          background: #2563eb;
        }
      }

      .error-message {
        margin: 0.75rem 0 0;
        padding: 0.5rem 0.75rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.375rem;
        color: #dc2626;
        font-size: 0.8125rem;
        line-height: 1.4;
      }
    `,
  ],
})
export class GpxImportComponent {
  @Input() errorMessage: string | null = null;
  @Output() fileSelected = new EventEmitter<File>();

  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
      input.value = '';
    }
  }
}
