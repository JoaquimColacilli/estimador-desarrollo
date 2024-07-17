// src/app/estimador.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EstimadorService {
  calcularEstimaciones(desarrolloHoras: number): any {
    const analisisFuncional = desarrolloHoras * 0.1;
    const analisisTecnico = desarrolloHoras * 0.1;
    const pruebasUnitarias = desarrolloHoras * 0.1;
    const pruebasIntegracion = desarrolloHoras * 0.1;
    const gestion = desarrolloHoras * 0.15;

    return {
      analisisFuncional,
      analisisTecnico,
      desarrollo: desarrolloHoras,
      pruebasUnitarias,
      pruebasIntegracion,
      gestion,
    };
  }
}
