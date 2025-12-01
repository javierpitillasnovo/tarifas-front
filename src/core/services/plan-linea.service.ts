import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import { environment } from '../../environments/environment';
import type { PlanLineaRiesgo } from '../interfaces/general.interface';

@Injectable({
	providedIn: 'root'
})
export class PlanLineaService {
	readonly #callApiService = inject(CallApiService);
	constructor() {}

	/**
	 * GET v1/planes_lineas/${idPlanLinea}/riesgos
	 * Devuelve [PlanLineaRiesgo]
	 */
	getRiesgos(idPlanLinea: string): Observable<PlanLineaRiesgo[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/riesgos`
		};
		return this.#callApiService.callApi<PlanLineaRiesgo[]>(params);
	}

	/**
	 * PUT v1/planes_lineas/${idPlanLinea}/riesgos
	 * Devuelve [PlanLineaRiesgo]
	 */
	updateRiesgos(idPlanLinea: string, listRiesgos: string[]): Observable<PlanLineaRiesgo[]> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/riesgos`,
			body: listRiesgos
		};
		return this.#callApiService.callApi<PlanLineaRiesgo[]>(params);
	}

	/**
	 * GET /v1/planes_lineas/{idPlanLinea}/tiene_riesgos
	 * Comprueba si un plan-línea tiene riesgos
	 */
	tieneRiesgos(idPlanLinea: string): Observable<boolean> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/tiene_riesgos`
		};
		return this.#callApiService.callApi<boolean>(params);
	}
}
