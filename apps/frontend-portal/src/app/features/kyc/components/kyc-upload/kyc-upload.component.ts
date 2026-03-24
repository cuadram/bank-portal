import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED  = ['image/jpeg', 'image/png', 'application/pdf'];

/**
 * Componente de subida de fichero con drag & drop y previsualización.
 * FEAT-013 US-1306 · Sprint 15
 */
@Component({
  selector: 'app-kyc-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-upload.component.html'
})
export class KycUploadComponent {

  @Input()  label = 'Arrastra tu documento aquí';
  @Input()  file: File | null = null;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileError    = new EventEmitter<string>();

  dragging  = false;
  preview   : string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(): void {
    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.process(file);
  }

  onFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.process(file);
  }

  private process(file: File): void {
    if (file.size > MAX_BYTES) {
      this.fileError.emit(
        'El archivo supera el tamaño máximo de 10 MB. Prueba con una imagen JPEG o PNG.');
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      this.fileError.emit('Formato no permitido. Usa JPEG, PNG o PDF.');
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => { this.preview = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.preview = null;
    }
    this.fileSelected.emit(file);
  }
}
