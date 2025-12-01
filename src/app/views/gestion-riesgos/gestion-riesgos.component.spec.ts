import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionRiesgosComponent } from './gestion-riesgos.component';

describe('GestionRiesgosComponent', () => {
  let component: GestionRiesgosComponent;
  let fixture: ComponentFixture<GestionRiesgosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionRiesgosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionRiesgosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
