import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RdvList } from './rdv-list';

describe('RdvList', () => {
  let component: RdvList;
  let fixture: ComponentFixture<RdvList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RdvList],
    }).compileComponents();

    fixture = TestBed.createComponent(RdvList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
