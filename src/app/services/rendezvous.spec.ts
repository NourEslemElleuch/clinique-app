import { TestBed } from '@angular/core/testing';

import { Rendezvous } from './rendezvous';

describe('Rendezvous', () => {
  let service: Rendezvous;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rendezvous);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
