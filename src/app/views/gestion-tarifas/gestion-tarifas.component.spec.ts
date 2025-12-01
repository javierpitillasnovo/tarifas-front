import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionTarifasComponent } from './gestion-tarifas.component';

describe('GestionTarifasComponent', () => {
  let component: GestionTarifasComponent;
  let fixture: ComponentFixture<GestionTarifasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionTarifasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionTarifasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
