import { Component, OnInit } from '@angular/core';
import { BizumService } from '../../services/bizum.service';
import { BizumStatus_Resp } from '../../models/bizum.model';

@Component({ selector: 'app-bizum-settings', templateUrl: './bizum-settings.component.html' })
export class BizumSettingsComponent implements OnInit {
  status: BizumStatus_Resp = { active: true, phoneMasked: '', dailyUsed: 0, dailyLimit: 2000, perOperationLimit: 500 };
  pushPayments = true; pushRequests = true; pushExpiry = false;

  constructor(private svc: BizumService) {}
  ngOnInit(): void { this.svc.getStatus().subscribe(s => this.status = s); }
}
