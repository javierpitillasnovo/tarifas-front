import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
	ViewContainerRef,
	ViewEncapsulation
} from '@angular/core';
import {
	ModalService,
	NotificationService,
	TableDirective,
	UiButtonComponent,
	UiTableComponent
} from '@agroseguro/lib-ui-agroseguro';
import { OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ModalAnadirFactorDeducibleComponent } from './modal-anadir-factor-deducible/modal-anadir-factor-deducible.component';
import { GruposFactoresService } from '../../../core/services/grupos-factores.service';
import { iFactorDeducible } from '../../../core/interfaces/general.interface';
import { ModalConsultaFactorDeducibleComponent } from './modal-consulta-factor-deducible/modal-consulta-factor-deducible.component';
import { ModalDeleteFactorDeducibleComponent } from './modal-delete-factor-deducible/modal-delete-factor-deducible.component';

@Component({
	selector: 'app-configuracion-factores-deducibles',
	standalone: true,
	imports: [ UiTableComponent, TableDirective, UiButtonComponent],
	templateUrl: './configuracion-factores-deducibles.component.html',
	styleUrl: './configuracion-factores-deducibles.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})
export class ConfiguracionFactoresDeduciblesComponent implements OnInit, OnDestroy {
	readonly #viewContainerRef = inject(ViewContainerRef);
	readonly #gruposFactoresService = inject(GruposFactoresService);
	readonly #modalService = inject(ModalService);
	readonly #notificationsService = inject(NotificationService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	listFactoresDeducibles = signal<iFactorDeducible[]>([]);

	public onLoadError = signal<boolean>(false);

	public factoresDeduciblesSetted = signal<boolean>(false);

	constructor() {
		this.#modalService.setViewContainerRef(this.#viewContainerRef);
		this.#notificationsService.setViewContainerRef(this.#viewContainerRef);
	}

	ngOnInit() {
		this.getFactoresDeducibles();
	}

	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}

	getFactoresDeducibles() {
		this.#gruposFactoresService.getFactoresDeducibles()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.factoresDeduciblesSetted.set(false);
					this.listFactoresDeducibles.set(JSON.parse(JSON.stringify(factores)));
					this.factoresDeduciblesSetted.set(true);
					this.onLoadError.set(false);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar los factores deducibles:', error);
				}
			});
	}

	crearFactorDeducibleModal(event: any) {
		this.#modalService
			.open(ModalAnadirFactorDeducibleComponent, { 
				size: 'l',
				factorDeducible: signal(null),
				edit: signal(false)
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if(response){
						this.#notificationsService.showNotification({
							message: signal('Factor deducible creado correctamente'),
							hasError: signal(false)
						});
						this.getFactoresDeducibles();
					}
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al crear el Factor deducible'),
						hasError: signal(true)
					});
				}
			});
	}

	editarFactorDeducibleModal(factorDeducible: iFactorDeducible) {
		this.#modalService
			.open(ModalAnadirFactorDeducibleComponent, { 
				factorDeducible: signal(factorDeducible),
				edit: signal(true),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if(response){
						this.#notificationsService.showNotification({
							message: signal('Factor deducible actualizado correctamente'),
							hasError: signal(false)
						});
						this.getFactoresDeducibles();
					}
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al actualizar el factor deducible'),
						hasError: signal(true)
					});
				}
			});
	}

	consultarFactorDeducibleModal(factorDeducible: iFactorDeducible) {
		this.#modalService
			.open(ModalConsultaFactorDeducibleComponent, { 
				listAllFactoresDeducibles: signal(this.listFactoresDeducibles()),
				idFactorDeducible: signal(factorDeducible.idGrupo),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {		
				},
				error: () => {	
				}
			});
	}

	deleteFactorDeducible(factorDeducible: any) {
		this.#modalService
			.open(ModalDeleteFactorDeducibleComponent, {
				factorDeducible: signal(factorDeducible),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if (response) {
						this.#notificationsService.showNotification({
							message: signal('Factor Deducible eliminado correctamente'),
							hasError: signal(false)
						});
						this.getFactoresDeducibles();
					}
				}
			});
	}
	
}
