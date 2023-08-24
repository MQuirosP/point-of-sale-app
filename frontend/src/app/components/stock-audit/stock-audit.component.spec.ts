/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { StockAuditComponent } from './stock-audit.component';

describe('StockAuditComponent', () => {
  let component: StockAuditComponent;
  let fixture: ComponentFixture<StockAuditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StockAuditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
