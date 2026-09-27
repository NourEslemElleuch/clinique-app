import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialiteList } from './specialite-list';

describe('SpecialiteList', () => {
  let component: SpecialiteList;
  let fixture: ComponentFixture<SpecialiteList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialiteList],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialiteList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
