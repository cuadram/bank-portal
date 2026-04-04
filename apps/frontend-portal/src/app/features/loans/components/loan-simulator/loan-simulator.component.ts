import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoanService } from '../../services/loan.service';
import { SimulationResponse } from '../../models/loan.model';

@Component({
  selector: 'app-loan-simulator',
  template: `
    <div class="simulator-page">
      <div class="page-header">
        <a routerLink="/prestamos" class="back-link">← Mis Préstamos</a>
        <h1>Simulador de Préstamo</h1>
        <p class="subtitle">Calcula tu cuota sin compromiso. TAE: 6,50% fija.</p>
      </div>

      <div class="simulator-layout">
        <div class="simulator-form card">
          <form [formGroup]="form" (ngSubmit)="simulate()">
            <div class="form-group">
              <label>Importe (€)</label>
              <input type="number" formControlName="importe" min="1000" max="60000" step="500" class="form-control" placeholder="ej: 15000"/>
              <small class="hint">Entre 1.000€ y 60.000€</small>
            </div>
            <div class="form-group">
              <label>Plazo (meses)</label>
              <input type="number" formControlName="plazo" min="12" max="84" step="12" class="form-control" placeholder="ej: 36"/>
              <small class="hint">De 12 a 84 meses</small>
            </div>
            <div class="form-group">
              <label>Finalidad</label>
              <select formControlName="finalidad" class="form-control">
                <option value="CONSUMO">Consumo</option>
                <option value="VEHICULO">Vehículo</option>
                <option value="REFORMA">Reforma del hogar</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
              {{ loading ? 'Calculando...' : '🧮 Calcular' }}
            </button>
          </form>
        </div>

        <div *ngIf="result" class="simulator-result card">
          <h3>Resultado de la simulación</h3>
          <div class="result-grid">
            <div class="result-item highlight">
              <span class="rl">Cuota mensual</span>
              <span class="rv big">{{ result.cuotaMensual | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
            </div>
            <div class="result-item">
              <span class="rl">TAE</span>
              <span class="rv">{{ result.tae }}%</span>
            </div>
            <div class="result-item">
              <span class="rl">Coste total</span>
              <span class="rv">{{ result.costeTotal | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
            </div>
            <div class="result-item">
              <span class="rl">Intereses totales</span>
              <span class="rv">{{ result.interesesTotales | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
            </div>
          </div>
          <a routerLink="/prestamos/solicitar" class="btn btn-primary mt">Solicitar este préstamo</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #1B3A6B; text-decoration: none; font-size: .9rem; }
    h1 { margin: .5rem 0 0; color: #1B3A6B; }
    .subtitle { color: #666; margin: .25rem 0 0; font-size: .9rem; }
    .simulator-layout { display: grid; grid-template-columns: 360px 1fr; gap: 1.5rem; }
    .card { background: #fff; border-radius: 10px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: .85rem; font-weight: 600; color: #333; margin-bottom: .3rem; }
    .form-control { width: 100%; padding: .6rem .8rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; box-sizing: border-box; }
    .hint { font-size: .75rem; color: #888; }
    .btn { display: inline-block; padding: .65rem 1.25rem; border-radius: 6px; border: none; cursor: pointer; font-size: .9rem; text-decoration: none; text-align: center; }
    .btn-primary { background: #1B3A6B; color: #fff; width: 100%; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    .result-item { display: flex; flex-direction: column; padding: .75rem; background: #f8f9fa; border-radius: 8px; }
    .result-item.highlight { background: #1B3A6B; color: #fff; }
    .rl { font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
    .rv { font-size: 1.1rem; font-weight: 700; margin-top: .2rem; }
    .rv.big { font-size: 1.6rem; }
    .mt { margin-top: 1rem; }
    @media (max-width: 768px) { .simulator-layout { grid-template-columns: 1fr; } }
  `]
})
export class LoanSimulatorComponent {
  form: FormGroup;
  result: SimulationResponse | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private loanService: LoanService) {
    this.form = this.fb.group({
      importe: [15000, [Validators.required, Validators.min(1000), Validators.max(60000)]],
      plazo:   [36,    [Validators.required, Validators.min(12),   Validators.max(84)]],
      finalidad: ['CONSUMO', Validators.required]
    });
  }

  simulate(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.loanService.simulate(this.form.value).subscribe(res => {
      this.result = res;
      this.loading = false;
    });
  }
}
