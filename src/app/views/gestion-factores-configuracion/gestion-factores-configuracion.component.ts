import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
	ViewContainerRef,
	ViewEncapsulation
} from '@angular/core';
import {
	UiButtonComponent,
	UiSelectComponent,
	ModalService,
	NotificationService
} from '@agroseguro/lib-ui-agroseguro';
import type { OnDestroy, OnInit } from '@angular/core';
import type { SelectOption } from '@agroseguro/lib-ui-agroseguro';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ModalGestionFactoresComponent } from './modal-gestion-factores/modal-gestion-factores.component';
import { GestionFactoresService } from '../../../core/services/gestion-factores.service';
import type { iFactor, iFactorLinea } from '../../../core/interfaces/general.interface';

@Component({
	selector: 'app-gestion-factores',
	standalone: true,
	imports: [ReactiveFormsModule, UiSelectComponent, UiButtonComponent],
	templateUrl: './gestion-factores-configuracion.component.html',
	styleUrl: './gestion-factores-configuracion.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})
export class GestionFactoresConfiguracionComponent implements OnInit, OnDestroy {
	// inyección con campos privados
	readonly #vcr = inject(ViewContainerRef);
	readonly #modalService = inject(ModalService);
	readonly #notificationService = inject(NotificationService);
	readonly #gestionFactoresSvc = inject(GestionFactoresService);
	readonly #destroy$ = new Subject<void>();

	public form = new FormGroup({
		grupoSeguro: new FormControl<string | null>(null, Validators.required)
	});

	// Lista de opciones para el selector de grupo seguro
	public grupoSeguroOptions = signal<SelectOption[]>([]);

	constructor() {
		this.#modalService.setViewContainerRef(this.#vcr);
		this.#notificationService.setViewContainerRef(this.#vcr);
	}

	ngOnInit(): void {
		this.#gestionFactoresSvc
			.getGruposSeguros()
			.pipe(takeUntil(this.#destroy$))
			.subscribe((opts) => {
				this.grupoSeguroOptions.set(opts);
				this.form.get('grupoSeguro')!.enable();
			});

		this.form
			.get('grupoSeguro')!
			.valueChanges.pipe(takeUntil(this.#destroy$))
			.subscribe((val) => {
				//console.log('Valor real seleccionado:', val);
			});
	}

	abrirModalFactores(): void {
		const grupo = this.form.get('grupoSeguro')?.value;
		//console.log('Valor enviado al modal:', grupo);
		if (!grupo) return;

		this.#modalService
			.open(ModalGestionFactoresComponent, {
				size: 'l',
				grupoSeguro: grupo
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (cfg: { linea: string; factores: iFactor[] }) => {
					const factoresConLinea: iFactorLinea[] = cfg.factores.map((f) => ({
						id: '',
						idLinea: cfg.linea,
						idFactor: f.id,
						descripcionFactor: f.nombre,
						simple: f.simple,
						precio: f.precio
					}));

					this.#gestionFactoresSvc
						.updateFactoresLinea(factoresConLinea)
						.pipe(takeUntil(this.#destroy$))
						.subscribe();
				}
			});
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
