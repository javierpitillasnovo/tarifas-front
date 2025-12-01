import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  output,
  signal,
  ViewEncapsulation,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	UiButtonComponent,
	UiInputComponent,
	UiTableComponent,
	TableDirective,
	ModalService,
	NotificationService
} from '@agroseguro/lib-ui-agroseguro';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanService } from '../../../../core/services/plan.service';
import { ModalDeleteCoeficienteComponent } from './modal-delete-coeficiente/modal-delete-coeficiente.component';
import { GestionFactoresService } from '../../../../core/services/gestion-factores.service';
import { Subject, takeUntil } from 'rxjs';
import { ModalEditCoeficienteComponent } from './modal-edit-coeficiente/modal-edit-coeficiente.component';

@Component({
  selector: 'app-asignacion-coeficientes',
  standalone: true,
  imports: [CommonModule, UiInputComponent, UiTableComponent, TableDirective],
  templateUrl: './asignacion-coeficientes.component.html',
  styleUrl: './asignacion-coeficientes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'asignacionCoeficientes',
  },
})
export class AsignacionCoeficientesComponent implements OnInit {
  // Servicios
  readonly #grupoSeguroService = inject(GrupoSeguroService);
  readonly #planService = inject(PlanService);
  readonly #modalService = inject(ModalService);
  readonly #gestionFactoresService = inject(GestionFactoresService);
  readonly #notificationsService = inject(NotificationService);
  readonly #destroy$ = new Subject<void>();


  // Eventos
  public onBack = output<void>();
  public onNext = output<void>();

  // Estado
  public data = signal<any[]>([]);
  public showAddButton = signal(true);

  // Datos para la miga de pan (dinámicos)
  public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
  public plan = computed(() => this.#grupoSeguroService.plan());
  public linea = computed(() => this.#grupoSeguroService.linea());
  public idPlanLinea = signal<string>('');

  ngOnInit(): void {
    const idPlan = this.plan();
        const idLinea = this.linea().id;

        if (!idPlan || !idLinea) {
          this.#notificationsService.showNotification({
            message: signal('Debe seleccionar plan y línea válidos'),
            hasError: signal(true)
          });
          return;
        }

        this.#planService
          .getPlanLinea(idPlan, idLinea)
          .pipe(takeUntil(this.#destroy$))
          .subscribe({
            next: (planLinea) => {
              this.idPlanLinea.set(planLinea.idPlanLinea);
              this.loadCoeficientes();
            },
            error: () => {
              this.#notificationsService.showNotification({
                message: signal('Error al recuperar el plan-línea'),
                hasError: signal(true)
              });
            }
          });

  }

  /** Añadir fila nueva */
  itemAdd() {
    this.showAddButton.set(false);

    const newCoef = {
      id: 0,
      nombre: '',
      selected: true,
    };

    this.data.update((items) => [...items, newCoef]);
  }

  /** Guardar coeficiente (POST real) */
  saveCoeficiente(item: any) {
    const idPlanLinea = this.idPlanLinea();
    if (!item.nombre?.trim()) {
      this.#notificationsService.showNotification({
        message: signal('El nombre del coeficiente no puede estar vacío'),
        hasError: signal(true)
      });
      return;
    }
    // Si es un coef nuevo → POST
    if (item.id === 0) {
      this.#gestionFactoresService
        .createCoeficiente(idPlanLinea, item.nombre)
        .pipe(takeUntil(this.#destroy$))
        .subscribe({
          next: () => {
            this.#notificationsService.showNotification({
              message: signal('Coeficiente creado correctamente'),
              hasError: signal(false)
            });

            this.loadCoeficientes();
          },
          error: () => {
            this.#notificationsService.showNotification({
              message: signal('Error al crear coeficiente'),
              hasError: signal(true)
            });
          }
        });

    } else {
      // FUTURO: PUT si quisieras usar este método
      console.warn('saveCoeficiente() en modo edición no implementado aquí');
    }

    this.showAddButton.set(true);
  }

deleteCoeficiente(item: any) {
  // Si es un coeficiente nuevo sin guardar (id = 0)
  if (item.id === 0) {
    this.data.set(this.data().filter((c) => c.id !== 0));
    this.showAddButton.set(true);
    return;
  }

  this.#modalService
    .open(ModalDeleteCoeficienteComponent, {
      coeficiente: signal(item),
      size: 'l'
    })
    .pipe(takeUntil(this.#destroy$))
    .subscribe({
      next: (confirmado) => {
        if (!confirmado) return;

        this.#gestionFactoresService
          .deleteCoeficiente(item.id)   // <-- NUEVO DELETE REAL
          .pipe(takeUntil(this.#destroy$))
          .subscribe({
            next: () => {
              this.#notificationsService.showNotification({
                message: signal('Coeficiente eliminado correctamente'),
                hasError: signal(false)
              });

              this.loadCoeficientes();
            },
            error: () => {
              this.#notificationsService.showNotification({
                message: signal('Error al eliminar el coeficiente'),
                hasError: signal(true)
              });
            }
          });
      }
    });
}


  verValores(item: any) {
    this.#grupoSeguroService.setIdCoeficienteSeleccionado(item.id);
    this.#grupoSeguroService.setNombreCoeficienteSeleccionado(item.nombre);
    this.onNext.emit();
  }


editarCoeficiente(item: any) {
  this.#modalService
    .open(ModalEditCoeficienteComponent, {
      coeficiente: signal({ id: item.id, nombre: item.nombre }),
      size: 'l'
    })
    .pipe(takeUntil(this.#destroy$))
    .subscribe({
      next: (data) => {
        if (!data) return;

        this.#gestionFactoresService
          .updateCoeficiente(data.id, data.nombreCoeficiente)
          .pipe(takeUntil(this.#destroy$))
          .subscribe({
            next: () => {
              this.#notificationsService.showNotification({
                message: signal('Coeficiente actualizado correctamente'),
                hasError: signal(false)
              });

              this.loadCoeficientes();
            },
            error: () => {
              this.#notificationsService.showNotification({
                message: signal('Error al actualizar coeficiente'),
                hasError: signal(true)
              });
            }
          });
      }
    });
}



private loadCoeficientes(): void {
    const idPlanLinea = this.idPlanLinea();

    if (!idPlanLinea) return;

    this.#gestionFactoresService
      .getCoeficientes(idPlanLinea)
      .pipe(takeUntil(this.#destroy$))
      .subscribe({
        next: (coeficientes) => {
          this.data.set(
            coeficientes.map(c => ({
              id: c.idCoeficiente,
              nombre: c.nombreCoeficiente,
              selected: false
            }))
          );

          this.showAddButton.set(true);
        },
        error: err => console.error('Error cargando coeficientes', err)
      });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }

}
