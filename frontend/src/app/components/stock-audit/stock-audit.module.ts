import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockAuditComponent } from './stock-audit.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: StockAuditComponent }])
  ],
  declarations: [StockAuditComponent]
})
export class StockAuditModule { }
