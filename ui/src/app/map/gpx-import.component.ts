import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-gpx-import',
  imports: [NgIf],
  templateUrl: './gpx-import.component.html',
  styleUrl: './gpx-import.component.scss',
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
