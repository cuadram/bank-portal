import { Component, Input } from '@angular/core';
import { AmortizationRow } from '../../models/loan.model';

@Component({
  selector: 'app-amortization-table',
  template: `
    <div class="amortization-section">
      <h3>Cuadro de Amortización</h3>
      <div class="table-wrapper">
        <table class="amort-table">
          <thead>
            <tr>
              <th>Cuota</th><th>Fecha</th><th>Capital</th><th>Intereses</th><th>Total</th><th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td>{{ row.n }}</td>
              <td>{{ row.fecha }}</td>
              <td>{{ row.capital | currency:'EUR':'symbol':'1.2-2':'es' }}</td>
              <td>{{ row.intereses | currency:'EUR':'symbol':'1.2-2':'es' }}</td>
              <td class="total">{{ row.cuotaTotal | currency:'EUR':'symbol':'1.2-2':'es' }}</td>
              <td>{{ row.saldoPendiente | currency:'EUR':'symbol':'1.2-2':'es' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .amortization-section { background: #fff; border-radius: 10px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    h3 { margin: 0 0 1rem; color: #1B3A6B; }
    .table-wrapper { overflow-x: auto; max-height: 400px; overflow-y: auto; }
    .amort-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    .amort-table th { background: #1B3A6B; color: #fff; padding: .6rem .8rem; text-align: right; position: sticky; top: 0; }
    .amort-table th:first-child { text-align: center; }
    .amort-table td { padding: .5rem .8rem; text-align: right; border-bottom: 1px solid #f0f0f0; }
    .amort-table td:first-child { text-align: center; color: #888; }
    .amort-table tr:hover td { background: #f8f9fa; }
    .total { font-weight: 600; color: #1B3A6B; }
  `]
})
export class AmortizationTableComponent {
  @Input() rows: AmortizationRow[] = [];
}
