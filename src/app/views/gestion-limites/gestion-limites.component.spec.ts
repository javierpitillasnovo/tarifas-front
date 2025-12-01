import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionLimitesComponent } from './gestion-limites.component';

describe('GestionLimitesComponent', () => {
  let component: GestionLimitesComponent;
  let fixture: ComponentFixture<GestionLimitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionLimitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionLimitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
