import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import type {
	iFactorDeducible,
	iFactorDeducibleNew} from '../interfaces/general.interface';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class GruposFactoresService {
	readonly #callApiService = inject(CallApiService);
	
	constructor() {}
	
	/**
	 * GET /v1/grupos_factores
	 * Servicio que devuelve todos los grupos de factores(Deducible)
	 */

	getFactoresDeducibles(): Observable<iFactorDeducible[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_factores`
		};
		return this.#callApiService.callApi<iFactorDeducible[]>(params);
	}

	/**
	 * GET /v1/grupos_factores
	 * Servicio que devuelve un grupos de factores(Deducible)
	 */

	getFactorDeducible(idGrupoFactores: string): Observable<iFactorDeducible> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_factores/${idGrupoFactores}`
		};
		return this.#callApiService.callApi<iFactorDeducible>(params);
	}

	/**
	 * POST /v1/grupos_factores
	 * Servicio que crea un grupo de factores(Deducible)
	 */
	newGrupoFactores(factorDeducible: iFactorDeducibleNew): Observable<iFactorDeducible> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/grupos_factores`,
			body: factorDeducible
		};
		return this.#callApiService.callApi<iFactorDeducible>(params);
	}

	/**
	* PUT /v1/grupos_factores/{uuid}
	* Servicio que actualiza un grupo de factores(Deducible)
	*/
	updateFactorDeducible(idFactorDeducible: string, body: iFactorDeducibleNew): Observable<iFactorDeducible> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/grupos_factores/${idFactorDeducible}`,
			body
		};
		return this.#callApiService.callApi<iFactorDeducible>(params);
	}

	/**
	 * DELETE /v1/grupos_factores/{idGrupoFactores}
	 * Elimina un grupo de factores(Deducible)
	 */
	deleteFactorDeducible(idGrupoFactores: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/grupos_factores/${idGrupoFactores}`
		};
		return this.#callApiService.callApi<void>(params);
	}

	
}
