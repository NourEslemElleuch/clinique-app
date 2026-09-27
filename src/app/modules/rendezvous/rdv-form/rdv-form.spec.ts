import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RdvForm } from './rdv-form';

describe('RdvForm', () => {
  let component: RdvForm;
  let fixture: ComponentFixture<RdvForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RdvForm],
    }).compileComponents();

    fixture = TestBed.createComponent(RdvForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
