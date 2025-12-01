import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import { environment } from '../../environments/environment';
import type { PlanLineaRiesgo, PlanLineaRiesgoVersion } from '../interfaces/general.interface';

@Injectable({
	providedIn: 'root'
})
export class PlanLineaRiesgoService {
	readonly #callApiService = inject(CallApiService);

	public planLineaRiesgo = signal<PlanLineaRiesgo>({
		idPlanLineaRiesgo: '',
		idPlanLinea: '',
		idRiesgo: '',
		descripcionRiesgo: '',
		simulado: false
	});
	public idPlanLineaRiesgo = signal<string>('');
	
	constructor() {}

	setIdPlanLineaRiesgo(id: string) {
		this.idPlanLineaRiesgo.set(id);
	}

	/**
	 * GET /v1/planes_lineas_riesgos/{idPlanLineaRiesgo}/versiones
	 * Devuelve [PlanLineaRiesgo]
	 */
	getRiesgos(idPlanLineaRiesgo: string): Observable<PlanLineaRiesgoVersion[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes_lineas_riesgos/${idPlanLineaRiesgo}/versiones`
		};
		return this.#callApiService.callApi<PlanLineaRiesgoVersion[]>(params);
	}

	/**
	 * PUT /v1/planes_lineas_riesgos/{idPlanLineaRiesgo}/simulado
	 * Modifica el valor del atributo 'simulado' de un riesgo dentro de un PL
	 */
	setRiesgoSimulado(idPlanLineaRiesgo: string, simulado: boolean): Observable<PlanLineaRiesgo> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/planes_lineas_riesgos/${idPlanLineaRiesgo}/simulado?simulado=${simulado}`
		};
		return this.#callApiService.callApi<PlanLineaRiesgo>(params);
	}

	/**
	 * DELETE /v1/planes_lineas_riesgos/{idPlanLineaRiesgo}
	 * Eliminar un riesgo de un plan-línea
	 */
	deleteRiesgo(idPlanLineaRiesgo: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/planes_lineas_riesgos/${idPlanLineaRiesgo}`
		};
		return this.#callApiService.callApi<void>(params);
	}
}
