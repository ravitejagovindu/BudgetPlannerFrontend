import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePlannerComponent } from './manage-planner.component';

describe('ManagePlannerComponent', () => {
  let component: ManagePlannerComponent;
  let fixture: ComponentFixture<ManagePlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManagePlannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagePlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
