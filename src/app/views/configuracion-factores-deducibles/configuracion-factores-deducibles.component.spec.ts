import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ConfiguracionFactoresDeduciblesComponent } from './configuracion-factores-deducibles.component';

describe('ConfiguracionFactoresDeduciblesComponent', () => {
	let component: ConfiguracionFactoresDeduciblesComponent;
	let fixture: ComponentFixture<ConfiguracionFactoresDeduciblesComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ConfiguracionFactoresDeduciblesComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(ConfiguracionFactoresDeduciblesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
