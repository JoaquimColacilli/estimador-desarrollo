import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  HostListener,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstimadorService } from '../service/estimador.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

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
  totalCalculoBackend: number = 0;
  totalCalculoFrontend: number = 0;
  tareas: { nombre: string; horas: number; microservice?: string }[] = [];
  tareasFrontend: { nombre: string; horas: number; microservice?: string }[] =
    [];
  tareaNombreFrontend: string = '';
  tareaHorasFrontend: number | null = null;
  isBrowser: boolean;
  showConfiguracion: boolean = false;
  formSubmitted = false;
  formData = {
    tituloDocumento: '',
    proyecto: '',
    desarrolladores: [''],
    descripcion: '',
    microservicioBackend: '',
    microservicioFrontend: '',
  };
  originalFormData = {
    tituloDocumento: '',
    proyecto: '',
    desarrolladores: [''],
    descripcion: '',
  };
  camposEstimacionBackend: CampoEstimacion[] = [...DEFAULT_VALORES_BACKEND];
  camposEstimacionFrontend: CampoEstimacion[] = [...DEFAULT_VALORES_FRONTEND];
  activeTab: 'backend' | 'frontend' = 'backend';
  showWarningModal = false;
  isFormModalOpen = false;
  showMicroservicesModalBackend = false;
  showMicroservicesModalFrontend = false;
  selectedMicroserviceBackend: string | null = null;
  selectedMicroserviceFrontend: string | null = null;
  microservicesBackend: string[] = [];
  microservicesFrontend: string[] = [];
  currentDate: string = '';
  showUploadModal = false;
  selectedFile: File | null = null;
  isDragging = false;
  uploadedFile: File | null = null;

  private tempMicroservicesBackend: string[] = [];
  private tempMicroservicesFrontend: string[] = [];
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

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.shouldWarnOnExit()) {
      $event.returnValue = true;
    }
  }

  shouldWarnOnExit(): boolean {
    return (
      (this.desarrolloHoras !== null && this.desarrolloHoras > 0) ||
      (this.frontendHoras !== null && this.frontendHoras > 0) ||
      this.tareas.length > 0 ||
      this.tareasFrontend.length > 0
    );
  }

  resetTareaFields(type: 'backend' | 'frontend') {
    if (type === 'backend') {
      this.tareaNombre = '';
      this.tareaHoras = null;
      this.selectedMicroserviceBackend = null;
    } else if (type === 'frontend') {
      this.tareaNombreFrontend = '';
      this.tareaHorasFrontend = null;
      this.selectedMicroserviceFrontend = null;
    }
  }

  validateAndDownloadPDF() {
    const { tituloDocumento, proyecto, desarrolladores } = this.formData;

    const isBackendMicroserviceValid =
      this.microservicesBackend.length > 0 ||
      this.formData.microservicioBackend;
    const isFrontendMicroserviceValid =
      this.microservicesFrontend.length > 0 ||
      this.formData.microservicioFrontend;

    const hasHoursOrTasks =
      this.desarrolloHoras ||
      this.frontendHoras ||
      this.tareas.length > 0 ||
      this.tareasFrontend.length > 0;

    if (
      !tituloDocumento ||
      !proyecto ||
      !desarrolladores[0] ||
      !hasHoursOrTasks ||
      (this.desarrolloHoras && !isBackendMicroserviceValid) ||
      (this.frontendHoras && !isFrontendMicroserviceValid)
    ) {
      this.showWarningModal = true;
    } else {
      this.downloadPDF();
    }
  }

  closeWarningModal() {
    this.showWarningModal = false;
  }

  downloadPDF(): void {
    const doc = new jsPDF('portrait', 'in', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 0.5;
    let currentY = margin;

    // Título del Documento
    doc.setFontSize(16);
    doc.text(this.formData.tituloDocumento, pageWidth / 2, currentY, {
      align: 'center',
    });
    currentY += 0.5;

    // Información general en una tabla
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      head: [['Proyecto', 'Autor', 'Versión', 'Descripción']],
      body: [
        [
          this.formData.proyecto,
          this.formData.desarrolladores.join(', '),
          '1.0',
          this.formData.descripcion || 'N/A',
        ],
      ],
    });

    currentY += 1; // Incrementa manualmente la posición Y después de la tabla (ajustar según sea necesario)

    // Registro de Cambios
    doc.setFontSize(14);
    doc.text('Registro de Cambios', margin, currentY);
    currentY += 0.25;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      head: [
        [
          'Versión',
          'Causa del cambio',
          'Responsable del cambio',
          'Fecha del cambio',
        ],
      ],
      body: [
        [
          '1.0',
          'Documento inicial',
          this.formData.desarrolladores[0],
          new Date().toLocaleDateString(),
        ],
      ],
    });

    currentY += 1; // Incrementa manualmente la posición Y después de la tabla (ajustar según sea necesario)

    // Salto de página para Resumen de Tareas y Cálculos
    doc.addPage();
    currentY = margin;

    doc.setFontSize(14);
    doc.text('Resumen de Tareas y Cálculos', margin, currentY);
    currentY += 0.25;

    // Tablas de Backend
    if (this.totalBackendHoras > 0) {
      doc.setFontSize(12);
      // doc.text('Backend', margin, currentY);
      currentY += 0.25;

      const backendTasks = this.tareas.map((t) => [
        t.nombre,
        t.microservice || this.formData.microservicioBackend,
        `${t.horas} Hs.`,
      ]);
      if (this.desarrolloHoras) {
        backendTasks.push([
          'Horas de Desarrollo',
          this.formData.microservicioBackend,
          `${this.desarrolloHoras} Hs.`,
        ]);
      }
      backendTasks.push(['Total Backend', '', `${this.totalBackendHoras} Hs.`]);

      autoTable(doc, {
        startY: currentY,
        head: [['Tarea', 'Microservicio', 'Horas']],
        body: backendTasks,
        margin: { left: margin },
        styles: { fontSize: 10 }, // Ajusta el tamaño de fuente si quieres que las tablas sean más grandes
      });

      currentY += 1; // Incrementa manualmente la posición Y después de la tabla (ajustar según sea necesario)
    }

    // Tablas de Frontend
    if (this.totalFrontendHoras > 0) {
      doc.setFontSize(12);
      // doc.text('Frontend', margin, currentY);
      currentY += 0.25;

      const frontendTasks = this.tareasFrontend.map((t) => [
        t.nombre,
        t.microservice || this.formData.microservicioFrontend,
        `${t.horas} Hs.`,
      ]);
      if (this.frontendHoras) {
        frontendTasks.push([
          'Horas de Desarrollo',
          this.formData.microservicioFrontend,
          `${this.frontendHoras} Hs.`,
        ]);
      }
      frontendTasks.push([
        'Total Frontend',
        '',
        `${this.totalFrontendHoras} Hs.`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Tarea', 'Microservicio', 'Horas']],
        body: frontendTasks,
        margin: { left: margin },
        styles: { fontSize: 10 }, // Ajusta el tamaño de fuente si quieres que las tablas sean más grandes
      });

      currentY += 1; // Incrementa manualmente la posición Y después de la tabla (ajustar según sea necesario)
    }

    // Cálculo Análisis
    if (this.totalCalculoBackend > 0 || this.totalCalculoFrontend > 0) {
      doc.setFontSize(14);
      // doc.text('Cálculo Análisis', margin, currentY);
      currentY += 0.25;

      autoTable(doc, {
        startY: currentY,
        head: [['Análisis', 'Backend', 'Frontend', 'Total']],
        body: [
          ...this.camposEstimacionBackend.map((campo) => [
            campo.label,
            `${this.estimaciones[campo.key + 'Back']} Hs.`,
            `${this.estimaciones[campo.key + 'Front']} Hs.`,
            `${
              this.estimaciones[campo.key + 'Back'] +
              this.estimaciones[campo.key + 'Front']
            } Hs.`,
          ]),
          // Fila de Total Cálculo
          [
            'Total Análisis:',
            '',
            '',
            `${this.totalCalculoBackend + this.totalCalculoFrontend} Hs.`,
          ],
        ],
        margin: { left: margin },
        styles: { fontSize: 10 },
      });

      console.log(this.camposEstimacionBackend);
      currentY += 1; // Incrementa manualmente la posición Y después de la tabla (ajustar según sea necesario)
    }

    // Desarrollo / Cálculo
    if (this.totalBackendHoras > 0 || this.totalFrontendHoras > 0) {
      doc.setFontSize(14);
      // doc.text('Desarrollo / Cálculo', margin, currentY);
      currentY += 2;

      autoTable(doc, {
        startY: currentY,
        head: [['Desarrollo / Análisis', 'Backend', 'Frontend', 'Total']],
        body: [
          [
            'Desarrollo',
            `${this.totalBackendHoras} Hs.`,
            `${this.totalFrontendHoras} Hs.`,
            `${this.totalBackendHoras + this.totalFrontendHoras} Hs.`,
          ],
          [
            'Análisis',
            `${this.totalCalculoBackend} Hs.`,
            `${this.totalCalculoFrontend} Hs.`,
            `${this.totalCalculoBackend + this.totalCalculoFrontend} Hs.`,
          ],
          [
            'Total Estimación',
            '',
            '',
            `${
              this.totalBackendHoras +
              this.totalFrontendHoras +
              this.totalCalculoBackend +
              this.totalCalculoFrontend
            } Hs.`,
          ],
        ],
        margin: { left: margin },
        styles: { fontSize: 10 },
      });
    }

    // Guardar el PDF
    doc.save(`${this.formData.tituloDocumento}.pdf`);
  }
  ngOnInit(): void {
    this.currentDate = new Date().toLocaleDateString();
  }

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

    // Inicializar las propiedades para los totales de cálculo
    this.totalCalculoBackend = 0;
    this.totalCalculoFrontend = 0;

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
      this.totalCalculoBackend += this.estimaciones[campo.key + 'Back']; // Sumar horas de cálculo Backend
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
      this.totalCalculoFrontend += this.estimaciones[campo.key + 'Front']; // Sumar horas de cálculo Frontend
    });

    this.estimaciones.desarrolloBackend = this.totalBackendHoras;
    this.estimaciones.desarrolloFront = this.totalFrontendHoras;
    this.estimaciones.desarrolloTotal =
      this.totalBackendHoras + this.totalFrontendHoras;

    // Sumar todas las horas para calcular el total general
    this.totalHoras =
      this.totalBackendHoras +
      this.totalFrontendHoras +
      this.totalCalculoBackend +
      this.totalCalculoFrontend;
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
        documentacionBack: 8,
        documentacionFront: 8,
      };
    }

    if (
      type === 'backend' &&
      this.tareaNombre &&
      this.tareaHoras &&
      this.tareaHoras > 0
    ) {
      this.tareas.push({
        nombre: this.tareaNombre,
        horas: this.tareaHoras,
        microservice: this.selectedMicroserviceBackend || '', // Incluye el microservicio seleccionado
      });
      this.tareaNombre = '';
      this.tareaHoras = null;
      this.selectedMicroserviceBackend = null; // Resetear el select

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
        microservice: this.selectedMicroserviceFrontend || '', // Incluye el microservicio seleccionado
      });
      this.tareaNombreFrontend = '';
      this.tareaHorasFrontend = null;
      this.selectedMicroserviceFrontend = null; // Resetear el select

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

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  addDeveloper() {
    this.formData.desarrolladores.push('');
  }

  removeDeveloper(index: number) {
    this.formData.desarrolladores.splice(index, 1);
  }

  openFormModal() {
    this.originalFormData = JSON.parse(JSON.stringify(this.formData));
    this.isFormModalOpen = true;
    this.currentDate = new Date().toLocaleDateString();
  }

  closeFormModal() {
    this.isFormModalOpen = false;
    this.formData = JSON.parse(JSON.stringify(this.originalFormData));
    this.formSubmitted = false;
  }

  submitForm() {
    this.formSubmitted = true;

    const isValid =
      this.formData.tituloDocumento &&
      this.formData.proyecto &&
      this.formData.desarrolladores.every((dev) => dev);

    // Validar microservicios solo si se están mostrando en el formulario
    const needsBackendMicroservice =
      this.microservicesBackend.length === 0 &&
      (this.desarrolloHoras || this.tareas.length > 0);
    const needsFrontendMicroservice =
      this.microservicesFrontend.length === 0 &&
      (this.frontendHoras || this.tareasFrontend.length > 0);

    const isMicroserviceValid =
      (!needsBackendMicroservice || this.formData.microservicioBackend) &&
      (!needsFrontendMicroservice || this.formData.microservicioFrontend);

    if (isValid && isMicroserviceValid) {
      this.originalFormData = JSON.parse(JSON.stringify(this.formData));
      console.log('Formulario enviado:', this.formData);
      this.closeFormModal();
    }
  }

  toggleMicroservicesModal(type: 'backend' | 'frontend') {
    if (type === 'backend') {
      if (!this.showMicroservicesModalBackend) {
        this.openMicroservicesModal('backend');
      } else {
        this.showMicroservicesModalBackend = false;
      }
    } else if (type === 'frontend') {
      if (!this.showMicroservicesModalFrontend) {
        this.openMicroservicesModal('frontend');
      } else {
        this.showMicroservicesModalFrontend = false;
      }
    }
  }

  addMicroservice(type: 'backend' | 'frontend') {
    if (type === 'backend') {
      this.microservicesBackend.push('');
    } else {
      this.microservicesFrontend.push('');
    }
  }

  removeMicroservice(type: 'backend' | 'frontend', index: number) {
    if (type === 'backend') {
      this.microservicesBackend.splice(index, 1);
    } else {
      this.microservicesFrontend.splice(index, 1);
    }
  }

  openMicroservicesModal(type: 'backend' | 'frontend') {
    this.formSubmitted = false; // Resetea la variable de formulario enviado para quitar las validaciones visuales

    if (type === 'backend') {
      // Almacena los valores actuales en las variables temporales
      this.tempMicroservicesBackend = [...this.microservicesBackend];
      if (this.microservicesBackend.length === 0) {
        this.microservicesBackend = ['', ''];
      }
      this.showMicroservicesModalBackend = true;
    } else if (type === 'frontend') {
      // Almacena los valores actuales en las variables temporales
      this.tempMicroservicesFrontend = [...this.microservicesFrontend];
      if (this.microservicesFrontend.length === 0) {
        this.microservicesFrontend = ['', ''];
      }
      this.showMicroservicesModalFrontend = true;
    }
  }

  closeMicroservicesModal(type: 'backend' | 'frontend') {
    if (type === 'backend') {
      // Restaura los valores de las variables temporales si se cierra el modal
      this.microservicesBackend = [...this.tempMicroservicesBackend];
      this.showMicroservicesModalBackend = false;
    } else {
      // Restaura los valores de las variables temporales si se cierra el modal
      this.microservicesFrontend = [...this.tempMicroservicesFrontend];
      this.showMicroservicesModalFrontend = false;
    }
    this.formSubmitted = false;
  }

  saveMicroservices(type: 'backend' | 'frontend') {
    let isValid = true;

    if (type === 'backend') {
      this.formSubmitted = true;

      // Validar que los dos primeros campos no estén vacíos
      if (!this.microservicesBackend[0] || !this.microservicesBackend[1]) {
        isValid = false;
      }

      // Validar que los campos adicionales no estén vacíos
      for (let i = 2; i < this.microservicesBackend.length; i++) {
        if (!this.microservicesBackend[i]) {
          isValid = false;
        }
      }

      if (isValid) {
        console.log(
          'Microservicios Backend guardados:',
          this.microservicesBackend
        );
        this.showMicroservicesModalBackend = false; // Cierra el modal después de guardar
      }
    } else if (type === 'frontend') {
      this.formSubmitted = true;

      // Validar que los dos primeros campos no estén vacíos
      if (!this.microservicesFrontend[0] || !this.microservicesFrontend[1]) {
        isValid = false;
      }

      // Validar que los campos adicionales no estén vacíos
      for (let i = 2; i < this.microservicesFrontend.length; i++) {
        if (!this.microservicesFrontend[i]) {
          isValid = false;
        }
      }

      if (isValid) {
        console.log(
          'Microservicios Frontend guardados:',
          this.microservicesFrontend
        );
        this.showMicroservicesModalFrontend = false; // Cierra el modal después de guardar
      }
    }
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

  // closeUploadModal(): void {
  //   this.showUploadModal = false;
  //   this.selectedFile = null;
  // }

  // onDragOver(event: DragEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  // }

  // onDragLeave(event: DragEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  // }

  // onDrop(event: DragEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   const file = event.dataTransfer?.files[0];
  //   if (file && file.type === 'application/pdf') {
  //     this.selectedFile = file;
  //   } else {
  //     alert('Solo se aceptan archivos PDF');
  //   }
  // }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      alert('Solo se aceptan archivos PDF');
    }
  }

  uploadFile(): void {
    if (this.uploadedFile) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const arrayBuffer = e.target.result;
        const typedArray = new Uint8Array(arrayBuffer);

        const pdfDoc = await getDocument(typedArray).promise;

        let pdfText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => {
              if ((item as any).str) {
                return (item as any).str;
              }
              return '';
            })
            .join(' ');
          pdfText += `Page ${i}: ${pageText}\n`;
        }

        console.log('Texto del PDF:', pdfText);
        const parsedData = this.parsePDFText(pdfText);
        console.log('Datos Parseados:', parsedData);
        this.closeUploadModal();
      };

      reader.readAsArrayBuffer(this.uploadedFile);
    }
  }

  parsePDFText(pdfText: string): any {
    const result: any = {};

    // Extraer "APPSADE-49193 | Estimacion"
    const estimationMatch = pdfText.match(/(\w+-\d+)\s+\|\s+(\w+)/);
    result.estimacion = estimationMatch
      ? {
          codigo: estimationMatch[1].trim(),
          titulo: estimationMatch[2].trim(),
        }
      : null;

    // Extraer información del proyecto
    const projectInfoMatch = pdfText.match(
      /Proyecto\s+([^\s]+)\s+Autor\s+([^\s]+)\s+Versión\s+([\d.]+)\s+Descripción\s+(.+?)\s+(Registro de Cambios|Resumen de Tareas y Cálculos)/
    );
    result.projectInfo = projectInfoMatch
      ? {
          proyecto: projectInfoMatch[1].trim(),
          autor: projectInfoMatch[2].trim(),
          version: projectInfoMatch[3].trim(),
          descripcion: projectInfoMatch[4].trim(),
        }
      : null;

    // Extraer registro de cambios
    const changesMatch = pdfText.match(
      /Versión\s+([\d.]+)\s+Causa del cambio\s+(.+?)\s+Responsable del cambio\s+([^\s]+)\s+Fecha del cambio\s+([\d/]+)/
    );
    result.registroCambios = changesMatch
      ? [
          {
            version: changesMatch[1].trim(),
            causaDelCambio: changesMatch[2].trim(),
            responsableDelCambio: changesMatch[3].trim(),
            fechaDelCambio: changesMatch[4].trim(),
          },
        ]
      : [];

    // Extraer tareas y cálculos
    const backendTasksMatch = pdfText.match(
      /Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Backend\s+([\d]+\s+Hs.)/
    );
    result.resumenTareasCalculos = backendTasksMatch
      ? {
          tareas: backendTasksMatch[1]
            .split(' Hs.')
            .slice(0, -1)
            .map((line) => {
              const taskMatch = line
                .trim()
                .match(/(.+)\s+([\w]+)\s+([\d]+\s+Hs.)/);
              return taskMatch
                ? {
                    tarea: taskMatch[1].trim(),
                    microservicio: taskMatch[2].trim(),
                    horas: taskMatch[3].trim(),
                  }
                : null;
            })
            .filter((task) => task !== null),
          totalBackend: backendTasksMatch[2].trim(),
        }
      : null;

    // Ajuste para capturar la sección de Análisis
    const analisisSectionMatch = pdfText.match(
      /Análisis\s+Backend\s+Frontend\s+Total\s+([\s\S]+?)Total\s+Análisis:\s+(\d+\s+Hs.)/
    );

    console.log('analisisSectionMatch:', analisisSectionMatch); // Verificar si ahora se captura

    if (analisisSectionMatch) {
      // Dividir la línea en análisis individuales
      const analisisItems =
        analisisSectionMatch[1].match(
          /.+?\s+\d+\s+Hs.\s+\d+\s+Hs.\s+\d+\s+Hs./g
        ) || [];

      console.log('analisisItems:', analisisItems); // Verificar las líneas de análisis

      result.calculoAnalisis = {
        analisis: analisisItems
          .map((item) => {
            const itemMatch = item.match(
              /(.+?)\s+(\d+\s+Hs.)\s+(\d+\s+Hs.)\s+(\d+\s+Hs.)/
            );
            return itemMatch
              ? {
                  tipo: itemMatch[1].trim(),
                  backend: itemMatch[2].trim(),
                  frontend: itemMatch[3].trim(),
                  total: itemMatch[4].trim(),
                }
              : null;
          })
          .filter((item) => item !== null),
        totalAnalisis: analisisSectionMatch[2].trim(),
      };
    } else {
      result.calculoAnalisis = null;
    }

    // Extraer desarrollo / análisis
    const desarrolloMatch = pdfText.match(
      /Desarrollo\s+\/\s+Análisis\s+Backend\s+Frontend\s+Total\s+([\s\S]+?)Total Estimación\s+([\d]+\s+Hs.)/
    );
    result.desarrolloAnalisis = desarrolloMatch
      ? {
          desarrollo: desarrolloMatch[1]
            .match(/.+?\s+\d+\s+Hs.\s+\d+\s+Hs.\s+\d+\s+Hs./g)
            ?.map((line) => {
              const desarrolloTaskMatch = line.match(
                /(.+?)\s+(\d+\s+Hs.)\s+(\d+\s+Hs.)\s+(\d+\s+Hs.)/
              );
              return desarrolloTaskMatch
                ? {
                    tipo: desarrolloTaskMatch[1].trim(),
                    backend: desarrolloTaskMatch[2].trim(),
                    frontend: desarrolloTaskMatch[3].trim(),
                    total: desarrolloTaskMatch[4].trim(),
                  }
                : null;
            })
            .filter((desarrollo) => desarrollo !== null),
          totalEstimacion: desarrolloMatch[2].trim(),
        }
      : null;

    return result;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadedFile = files[0];
      // Lógica para manejar el archivo subido
    }
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadedFile = input.files[0];
    }
  }

  closeUploadModal() {
    this.isDragging = false;
    this.uploadedFile = null;
    this.showUploadModal = false;
  }
}
