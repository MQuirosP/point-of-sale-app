import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockAuditComponent } from './stock-audit.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductsPipe } from 'src/app/pipes/products.pipe';
import { SharedModule } from 'src/app/pipes/sharedModule';

@NgModule({
  declarations: [StockAuditComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: StockAuditComponent }]),
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
})
export class StockAuditModule { }
