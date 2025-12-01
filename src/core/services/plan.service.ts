import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import { environment } from '../../environments/environment';
import { PlanLinea } from '../interfaces/general.interface';

@Injectable({
	providedIn: 'root'
})
export class PlanService {
	readonly #callApiService = inject(CallApiService);
	public idPlanLinea = signal<string>('');

	constructor() {}

	/**
	 * GET /v1/planes
	 * Devuelve [{ string }]
	 * Lo mapeamos a { text, value } para el <ui-select>
	 */
	getPlanes(): Observable<{ text: string; value: string }[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes`
		};

		return this.#callApiService.callApi<string[]>(params).pipe(
			map((planes) =>
				planes.map((p) => ({
					text: p,
					value: p
				}))
			)
		);
	}

	/**
	 * GET v1/planes/${idPlan}/lineas/${idLinea}
	 * Devuelve PlanLinea
	 */
	getPlanLinea(idPlan: string, idLinea: string): Observable<PlanLinea> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes/${idPlan}/lineas/${idLinea}`
		};
		return this.#callApiService.callApi<PlanLinea>(params);
	}

	/**
	 * Post v1/planes/${idPlan}/lineas/${idLinea}
	 * Devuelve PlanLinea
	 */
	postPlanLinea(idPlan: string, idLinea: string): Observable<PlanLinea> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/planes/${idPlan}/lineas/${idLinea}`
		};
		return this.#callApiService.callApi<PlanLinea>(params);
	}


}
