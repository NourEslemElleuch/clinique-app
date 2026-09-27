import { TestBed } from '@angular/core/testing';

import { Specialite } from './specialite';

describe('Specialite', () => {
  let service: Specialite;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Specialite);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
