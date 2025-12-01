import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import type {
	iFactorGlobal} from '../interfaces/general.interface';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class FactoresService {
	readonly #callApiService = inject(CallApiService);
	
	constructor() {}
	
	/**
	 * GET /v1/factores
	 * Servicio que devuelve todos los factores disponibles
	 */

	getFactores(): Observable<iFactorGlobal[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/factores`
		};
		return this.#callApiService.callApi<iFactorGlobal[]>(params);
	}

	
}
