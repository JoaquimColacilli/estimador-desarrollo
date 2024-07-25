import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstimadorService } from '../service/estimador.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estimador',
  templateUrl: './estimador.component.html',
  styleUrls: ['./estimador.component.css'],
  standalone: true,
  imports: [FormsModule, NgChartsModule, CommonModule],
})
export class EstimadorComponent implements OnInit {
  desarrolloHoras: number | null = null;
  frontendHoras: number | null = null;
  estimaciones: any = null;
  totalHoras: number = 0;
  totalBackendHoras: number = 0;
  totalFrontendHoras: number = 0;
  showEstimaciones: boolean = false;
  animatingOut: boolean = false;
  showTareasCard: boolean = false;
  showFrontendTareasCard: boolean = false;
  showFrontend: boolean = false;
  tareaNombre: string = '';
  tareaHoras: number | null = null;
  tareas: { nombre: string; horas: number }[] = [];
  tareaNombreFrontend: string = '';
  tareaHorasFrontend: number | null = null;
  tareasFrontend: { nombre: string; horas: number }[] = [];
  isBrowser: boolean;

  public pieChartLabels: string[] = [
    'Análisis Funcional',
    'Análisis Técnico',
    'Desarrollo Backend',
    'Desarrollo Front',
    'Pruebas Unitarias',
    'Pruebas de Integración',
    'Implementación y Soporte',
    'Gestión',
  ];
  public pieChartData: ChartData<'pie'> = {
    labels: this.pieChartLabels,
    datasets: [{ data: [] }],
  };
  public pieChartType: ChartType = 'pie';

  constructor(
    private estimadorService: EstimadorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {}

  handleFrontendSwitch(): void {
    if (!this.showFrontend) {
      this.frontendHoras = null;
      this.showFrontendTareasCard = false;
    }
    this.calcularEstimacion();
  }

  calcularEstimacion(): void {
    const totalBackendHoras =
      (this.desarrolloHoras || 0) +
      (this.showTareasCard
        ? this.tareas.reduce((acc, tarea) => acc + tarea.horas, 0)
        : 0);
    const frontendHoras = this.frontendHoras || 0;

    if (
      totalBackendHoras > 0 ||
      frontendHoras > 0 ||
      this.tareas.length > 0 ||
      this.tareasFrontend.length > 0
    ) {
      this.estimaciones =
        this.estimadorService.calcularEstimaciones(totalBackendHoras);
      this.calcularTotalHoras();
      if (this.isBrowser) {
        this.updatePieChartData();
      }
      this.showEstimaciones = true;
    } else {
      this.animatingOut = true;
      setTimeout(() => {
        this.animatingOut = false;
        this.estimaciones = null;
        this.showEstimaciones = false;
        this.totalHoras = 0;
        this.totalBackendHoras = 0;
        this.totalFrontendHoras = 0;
      }, 500); // Duración de la animación
    }
  }

  calcularTotalHoras(): void {
    const totalTareasHoras = this.showTareasCard
      ? this.tareas.reduce((acc, tarea) => acc + tarea.horas, 0)
      : 0;
    const totalTareasFrontendHoras = this.showFrontendTareasCard
      ? this.tareasFrontend.reduce((acc, tarea) => acc + tarea.horas, 0)
      : 0;

    const desarrolloBackendHoras = this.desarrolloHoras ?? 0;
    const desarrolloFrontHoras = this.frontendHoras ?? 0;

    this.totalBackendHoras = desarrolloBackendHoras + totalTareasHoras;
    this.totalFrontendHoras = this.showFrontend
      ? desarrolloFrontHoras + totalTareasFrontendHoras
      : 0;

    this.totalHoras = this.totalBackendHoras + this.totalFrontendHoras;

    if (this.estimaciones) {
      this.estimaciones.desarrolloBackend = this.totalBackendHoras;
      this.estimaciones.desarrolloFront = this.totalFrontendHoras;

      // Recalcular estimaciones con las horas de las tareas backend incluidas
      const totalBackendHorasWithTareas =
        this.desarrolloHoras! + totalTareasHoras;
      this.estimaciones = this.estimadorService.calcularEstimaciones(
        totalBackendHorasWithTareas
      );
      this.estimaciones.desarrolloBackend = this.totalBackendHoras;
    }
  }

  updatePieChartData(): void {
    if (this.estimaciones) {
      this.pieChartData = {
        labels: this.pieChartLabels,
        datasets: [
          {
            data: [
              this.estimaciones.analisisFuncional,
              this.estimaciones.analisisTecnico,
              this.totalBackendHoras,
              this.totalFrontendHoras,
              this.estimaciones.pruebasUnitarias,
              this.estimaciones.pruebasIntegracion,
              this.estimaciones.implementacionYSoporte,
              this.estimaciones.gestion,
            ],
          },
        ],
      };
    } else {
      this.pieChartData = {
        labels: this.pieChartLabels,
        datasets: [{ data: [] }],
      };
    }
  }

  toggleTareasCard(): void {
    this.showTareasCard = !this.showTareasCard;
    if (this.showTareasCard) {
      this.desarrolloHoras = null;
      this.estimaciones = null;
    }
    this.calcularTotalHoras();
  }

  toggleFrontendTareasCard(): void {
    this.showFrontendTareasCard = !this.showFrontendTareasCard;
    if (this.showFrontendTareasCard) {
      this.frontendHoras = null;
      this.estimaciones = null;
    }
    this.calcularTotalHoras();
  }

  agregarTarea(type: 'backend' | 'frontend'): void {
    if (!this.estimaciones) {
      this.estimaciones = {
        analisisFuncional: 0,
        analisisTecnico: 0,
        desarrolloBackend: 0,
        desarrolloFront: 0,
        pruebasUnitarias: 0,
        pruebasIntegracion: 0,
        implementacionYSoporte: 0,
        gestion: 0,
      };
    }

    if (
      type === 'backend' &&
      this.tareaNombre &&
      this.tareaHoras &&
      this.tareaHoras > 0
    ) {
      this.tareas.push({ nombre: this.tareaNombre, horas: this.tareaHoras });
      this.tareaNombre = '';
      this.tareaHoras = null;

      this.calcularTotalHoras();
      this.updatePieChartData();
    } else if (
      type === 'frontend' &&
      this.tareaNombreFrontend &&
      this.tareaHorasFrontend &&
      this.tareaHorasFrontend > 0
    ) {
      this.tareasFrontend.push({
        nombre: this.tareaNombreFrontend,
        horas: this.tareaHorasFrontend,
      });
      this.tareaNombreFrontend = '';
      this.tareaHorasFrontend = null;

      this.calcularTotalHoras();
      this.updatePieChartData();
    }
  }

  eliminarTarea(type: 'backend' | 'frontend', index: number): void {
    if (type === 'backend') {
      this.tareas.splice(index, 1);
    } else if (type === 'frontend') {
      this.tareasFrontend.splice(index, 1);
    }
    this.calcularTotalHoras();
    this.updatePieChartData();
  }
}
