import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	NotificationService,
	UiButtonComponent,
	UiFileUploadComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-modal-import-file',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent, UiFileUploadComponent],
	templateUrl: './modal-import-file.component.html',
	styleUrl: './modal-import-file.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalImportFileComponent implements OnDestroy {
	public title = input.required<string>();
	public subtitle = input.required<string>();
	public extensionesValidas = input<string[]>();
	public modalOutput = output<File>();

	readonly #modalService = inject(ModalService);
	readonly #notificationsService = inject(NotificationService);
	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	ficheroImportado: File | null = null;

	constructor() {}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}

	fileUploadChanges(event: Event) {
		this.ficheroImportado = this.getInputFile(event);
	}

	getInputFile(event: Event): File {
		const input = event.target as HTMLInputElement;
		return input.files ? input.files[0] : null!;
	}

	validateExtensions(fileName: string): boolean {
		const allowedExtensions = new RegExp(
			`(${this.extensionesValidas()!
				.map((ext) => ext.replace('.', '\\.'))
				.join('|')})$`,
			'i'
		);
		return allowedExtensions.exec(fileName) !== null;
	}

	importar() {
		if (this.ficheroImportado == null) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar un fichero para importar'),
				hasError: signal(true)
			});
			return;
		}
		if (
			this.extensionesValidas() != null &&
			this.extensionesValidas()!.length > 0 &&
			!this.validateExtensions(this.ficheroImportado.name)
		) {
			this.#notificationsService.showNotification({
				message: signal(
					`El fichero debe tener una de las siguientes extensiones: ${this.extensionesValidas()!.join(', ')}`
				),
				hasError: signal(true)
			});
			return;
		}

		this.ficheroImportado!.arrayBuffer()
			.then((buffer) => {
				const blob = new Blob([buffer], { type: this.ficheroImportado!.type });
				this.modalOutput.emit(blob as File);
				this.#modalService.close();
			})
			.catch((error) => {
				//observer.error(new Error('Error reading file: ' + error));
				this.#notificationsService.showNotification({
					message: signal('Error al leer el fichero seleccionado'),
					hasError: signal(true)
				});
			});
	}

	cancel() {
		this.#modalService.close();
	}
}
