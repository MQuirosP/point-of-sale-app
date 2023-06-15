import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalWatchComponent } from './digital-watch.component';

describe('DigitalWatchComponent', () => {
  let component: DigitalWatchComponent;
  let fixture: ComponentFixture<DigitalWatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DigitalWatchComponent]
    });
    fixture = TestBed.createComponent(DigitalWatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
