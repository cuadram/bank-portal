import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BizumService } from '../../services/bizum.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bizum-activate',
  templateUrl: './bizum-activate.component.html'
})
export class BizumActivateComponent {
  phoneCtrl = new FormControl('', [Validators.required]);
  loading = false;
  error = '';

  constructor(private svc: BizumService, private router: Router) {}

  activate(): void {
    if (!this.phoneCtrl.value) return;
    this.loading = true;
    this.svc.activate(this.phoneCtrl.value).subscribe({
      next: () => this.router.navigateByUrl('/bizum'),
      error: (e: any) => { this.error = e.error?.message || 'Error al activar'; this.loading = false; }
    });
  }

  back(): void { this.router.navigateByUrl('/bizum'); }
}
