import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualPlannerComponent } from './annual-planner.component';

describe('AnnualPlannerComponent', () => {
  let component: AnnualPlannerComponent;
  let fixture: ComponentFixture<AnnualPlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AnnualPlannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnualPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
