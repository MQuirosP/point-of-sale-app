import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainBoardComponent } from './main-board.component';

describe('MainBoardComponent', () => {
  let component: MainBoardComponent;
  let fixture: ComponentFixture<MainBoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainBoardComponent]
    });
    fixture = TestBed.createComponent(MainBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
