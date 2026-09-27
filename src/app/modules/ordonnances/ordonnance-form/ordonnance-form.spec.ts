import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdonnanceForm } from './ordonnance-form';

describe('OrdonnanceForm', () => {
  let component: OrdonnanceForm;
  let fixture: ComponentFixture<OrdonnanceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdonnanceForm],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdonnanceForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
