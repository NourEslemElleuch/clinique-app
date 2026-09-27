import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialiteForm } from './specialite-form';

describe('SpecialiteForm', () => {
  let component: SpecialiteForm;
  let fixture: ComponentFixture<SpecialiteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialiteForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialiteForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
