import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCoeficientesComponent } from './gestion-coeficientes.component';

describe('GestionCoeficientesComponent', () => {
  let component: GestionCoeficientesComponent;
  let fixture: ComponentFixture<GestionCoeficientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionCoeficientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCoeficientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
