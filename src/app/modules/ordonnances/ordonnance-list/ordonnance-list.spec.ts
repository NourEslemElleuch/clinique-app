import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdonnanceList } from './ordonnance-list';

describe('OrdonnanceList', () => {
  let component: OrdonnanceList;
  let fixture: ComponentFixture<OrdonnanceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdonnanceList],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdonnanceList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
