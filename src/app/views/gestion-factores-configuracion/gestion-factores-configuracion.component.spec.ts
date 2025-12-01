import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { GestionFactoresConfiguracionComponent } from './gestion-factores-configuracion.component';

describe('GestionFactoresComponent', () => {
	let component: GestionFactoresConfiguracionComponent;
	let fixture: ComponentFixture<GestionFactoresConfiguracionComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [GestionFactoresConfiguracionComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(GestionFactoresConfiguracionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
