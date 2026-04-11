import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RenewalInstruction } from '../../models/deposit.model';

@Component({
  selector: 'app-renewal-selector',
  template: `<div></div>`,  // Gestionado inline en deposit-detail
  styles: []
})
export class RenewalSelectorComponent {
  @Input() current: RenewalInstruction = 'RENEW_MANUAL';
  @Output() selected = new EventEmitter<RenewalInstruction>();
}
