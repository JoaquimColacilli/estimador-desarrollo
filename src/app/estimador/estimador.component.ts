import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstimadorService } from '../service/estimador.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

let html2pdf: any;

interface CampoEstimacion {
  key: string;
  label: string;
  porcentaje: number | null | undefined; // Permite número, null o undefined
  horas: number | null;
  modo: 'porcentaje' | 'horas';
}

const DEFAULT_VALORES_BACKEND: CampoEstimacion[] = [
  {
    key: 'analisisFuncional',
    label: 'Análisis Funcional',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'analisisTecnico',
    label: 'Análisis Técnico',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'pruebasUnitarias',
    label: 'Pruebas Unitarias',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'pruebasIntegracion',
    label: 'Pruebas de Integración',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'implementacionYSoporte',
    label: 'Implementación y Soporte',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'gestion',
    label: 'Gestión',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'documentacion',
    label: 'Documentación',
    porcentaje: undefined,
    horas: 8,
    modo: 'horas',
  },
];

const DEFAULT_VALORES_FRONTEND: CampoEstimacion[] = [
  {
    key: 'analisisFuncional',
    label: 'Análisis Funcional',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'analisisTecnico',
    label: 'Análisis Técnico',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'pruebasUnitarias',
    label: 'Pruebas Unitarias',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'pruebasIntegracion',
    label: 'Pruebas de Integración',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'implementacionYSoporte',
    label: 'Implementación y Soporte',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'gestion',
    label: 'Gestión',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
  },
  {
    key: 'documentacion',
    label: 'Documentación',
    porcentaje: undefined,
    horas: 8,
    modo: 'horas',
  },
];

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
  showConfiguracion: boolean = false;

  camposEstimacionBackend: CampoEstimacion[] = [...DEFAULT_VALORES_BACKEND];
  camposEstimacionFrontend: CampoEstimacion[] = [...DEFAULT_VALORES_FRONTEND];

  activeTab: 'backend' | 'frontend' = 'backend';

  public pieChartLabels: string[] = [
    'Análisis Funcional',
    'Análisis Técnico',
    'Desarrollo Backend',
    'Desarrollo Front',
    'Pruebas Unitarias',
    'Pruebas de Integración',
    'Implementación y Soporte',
    'Gestión',
    'Documentación', // Nuevo campo Documentación
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

    if (this.isBrowser) {
      import('html2pdf.js').then((module) => {
        html2pdf = module.default;
      });
    }
  }

  downloadPDF(): void {
    if (this.isBrowser && html2pdf) {
      const element = document.getElementById('content-to-export');
      const options = {
        margin: 0,
        filename: 'estimador-desarrollos.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };
      if (element) {
        html2pdf()
          .from(element)
          .set(options)
          .save()
          .then(() => {
            console.log('PDF generado y descargado exitosamente.');
          })
          .catch((error: any) => {
            console.error('Error al generar el PDF:', error);
          });
      } else {
        console.error('El elemento a exportar no se encontró.');
      }
    } else {
      console.error('html2pdf no está disponible o no estás en un navegador.');
    }
  }

  ngOnInit(): void {}

  handleFrontendSwitch(): void {
    if (!this.showFrontend) {
      this.frontendHoras = null;
      this.showFrontendTareasCard = false;
    }
    this.calcularEstimacion();
  }

  toggleConfiguracion(): void {
    this.showConfiguracion = !this.showConfiguracion;
  }

  switchTab(tab: 'backend' | 'frontend'): void {
    this.activeTab = tab;
  }

  guardarConfiguracion(): void {
    this.calcularEstimacion();
    this.toggleConfiguracion();
  }

  updateEstimaciones(): void {
    this.calcularEstimacion();
  }

  restablecerValores(): void {
    if (this.activeTab === 'backend') {
      this.camposEstimacionBackend = JSON.parse(
        JSON.stringify(DEFAULT_VALORES_BACKEND)
      );
    } else if (this.activeTab === 'frontend') {
      this.camposEstimacionFrontend = JSON.parse(
        JSON.stringify(DEFAULT_VALORES_FRONTEND)
      );
    }
    this.updateEstimaciones();
  }

  isValidConfiguration(): boolean {
    const camposEstimacion =
      this.activeTab === 'backend'
        ? this.camposEstimacionBackend
        : this.camposEstimacionFrontend;
    return camposEstimacion.every((campo) => {
      if (campo.modo === 'porcentaje' && campo.porcentaje !== undefined) {
        return (
          campo.porcentaje !== null &&
          campo.porcentaje >= 0 &&
          campo.porcentaje <= 100
        );
      } else if (campo.modo === 'horas') {
        return campo.horas !== null && campo.horas >= 0;
      } else {
        // Para el caso en que campo.porcentaje sea undefined
        return true;
      }
    });
  }

  calcularEstimacion(): void {
    this.totalBackendHoras =
      (this.desarrolloHoras || 0) +
      (this.showTareasCard
        ? this.tareas.reduce((acc, tarea) => acc + tarea.horas, 0)
        : 0);

    this.totalFrontendHoras =
      (this.frontendHoras || 0) +
      (this.showFrontendTareasCard
        ? this.tareasFrontend.reduce((acc, tarea) => acc + tarea.horas, 0)
        : 0);

    this.totalHoras = this.totalBackendHoras + this.totalFrontendHoras;

    if (this.totalHoras > 0) {
      this.calcularTotalHoras();
      this.updatePieChartData();
      this.showEstimaciones = true;
    } else {
      this.showEstimaciones = false;
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

    if (!this.estimaciones) {
      this.estimaciones = {};
    }

    // Reiniciar las estimaciones antes de calcular
    this.estimaciones = {
      analisisFuncionalTotal: 0,
      analisisTecnicoTotal: 0,
      pruebasUnitariasTotal: 0,
      pruebasIntegracionTotal: 0,
      implementacionYSoporteTotal: 0,
      gestionTotal: 0,
      documentacionTotal: 0, // Inicializar documentación
    };

    this.camposEstimacionBackend.forEach((campo) => {
      if (campo.key === 'documentacion' && this.totalBackendHoras === 0) {
        this.estimaciones[campo.key + 'Back'] = 0;
      } else if (
        campo.modo === 'porcentaje' &&
        campo.porcentaje !== undefined &&
        campo.porcentaje !== null
      ) {
        this.estimaciones[campo.key + 'Back'] = Math.round(
          (this.totalBackendHoras * campo.porcentaje) / 100
        );
      } else {
        this.estimaciones[campo.key + 'Back'] = campo.horas ?? 0;
      }
      this.estimaciones[campo.key + 'Total'] +=
        this.estimaciones[campo.key + 'Back'];
    });

    this.camposEstimacionFrontend.forEach((campo) => {
      if (campo.key === 'documentacion' && this.totalFrontendHoras === 0) {
        this.estimaciones[campo.key + 'Front'] = 0;
      } else if (
        campo.modo === 'porcentaje' &&
        campo.porcentaje !== undefined &&
        campo.porcentaje !== null
      ) {
        this.estimaciones[campo.key + 'Front'] = Math.round(
          (this.totalFrontendHoras * campo.porcentaje) / 100
        );
      } else {
        this.estimaciones[campo.key + 'Front'] = campo.horas ?? 0;
      }
      this.estimaciones[campo.key + 'Total'] +=
        this.estimaciones[campo.key + 'Front'];
    });

    this.estimaciones.desarrolloBackend = this.totalBackendHoras;
    this.estimaciones.desarrolloFront = this.totalFrontendHoras;
    this.estimaciones.desarrolloTotal =
      this.totalBackendHoras + this.totalFrontendHoras;

    // Sumar todas las horas para calcular el total general
    this.totalHoras = Object.keys(this.estimaciones)
      .filter((key) => key.endsWith('Total'))
      .reduce((acc, key) => acc + (this.estimaciones[key] || 0), 0);
  }

  updatePieChartData(): void {
    if (this.estimaciones) {
      this.pieChartData = {
        labels: this.pieChartLabels,
        datasets: [
          {
            data: [
              this.estimaciones.analisisFuncionalTotal,
              this.estimaciones.analisisTecnicoTotal,
              this.estimaciones.desarrolloBackend,
              this.estimaciones.desarrolloFront,
              this.estimaciones.pruebasUnitariasTotal,
              this.estimaciones.pruebasIntegracionTotal,
              this.estimaciones.implementacionYSoporteTotal,
              this.estimaciones.gestionTotal,
              this.estimaciones.documentacionTotal, // Nuevo campo Documentación
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

  editarTarea(type: 'backend' | 'frontend', index: number): void {
    let tarea;
    if (type === 'backend') {
      tarea = this.tareas[index];
      this.tareaNombre = tarea.nombre;
      this.tareaHoras = tarea.horas;
      this.eliminarTarea('backend', index); // Elimina la tarea antigua para reemplazarla con la editada
    } else if (type === 'frontend') {
      tarea = this.tareasFrontend[index];
      this.tareaNombreFrontend = tarea.nombre;
      this.tareaHorasFrontend = tarea.horas;
      this.eliminarTarea('frontend', index); // Elimina la tarea antigua para reemplazarla con la editada
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
        analisisFuncionalBack: 0,
        analisisTecnicoBack: 0,
        desarrolloBackend: 0,
        desarrolloFront: 0,
        pruebasUnitariasBack: 0,
        pruebasIntegracionBack: 0,
        implementacionYSoporteBack: 0,
        gestionBack: 0,
        analisisFuncionalFront: 0,
        analisisTecnicoFront: 0,
        pruebasUnitariasFront: 0,
        pruebasIntegracionFront: 0,
        implementacionYSoporteFront: 0,
        gestionFront: 0,
        documentacionBack: 8, // Default de Documentación Backend
        documentacionFront: 8, // Default de Documentación Frontend
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
      this.showEstimaciones = true;
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
      this.showEstimaciones = true;
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
