import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockAuditComponent } from './stock-audit.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsPipe } from 'src/app/pipes/products.pipe';

@NgModule({
  declarations: [StockAuditComponent, ProductsPipe],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: StockAuditComponent }]),
    FormsModule,
  ],
})
export class StockAuditModule { }
