import { TestBed } from '@angular/core/testing';
import { FactoresService } from './factores.service';


describe('FactoresService', () => {
  let service: FactoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FactoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
