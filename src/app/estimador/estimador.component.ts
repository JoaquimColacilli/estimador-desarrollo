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
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

let html2pdf: any;

interface CampoEstimacion {
  key: string;
  label: string;
  porcentaje: number | null | undefined;
  horas: number | null;
  modo: 'porcentaje' | 'horas';
  editing?: boolean;
}

const DEFAULT_VALORES_BACKEND: CampoEstimacion[] = [
  {
    key: 'analisisFuncional',
    label: 'Análisis Funcional',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'analisisTecnico',
    label: 'Análisis Técnico',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'pruebasUnitarias',
    label: 'Pruebas Unitarias',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'pruebasIntegracion',
    label: 'Pruebas de Integración',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'implementacionYSoporte',
    label: 'Implementación y Soporte',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'gestion',
    label: 'Gestión',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'documentacion',
    label: 'Documentación',
    porcentaje: undefined,
    horas: 8,
    modo: 'horas',
    editing: false,
  },
];

const DEFAULT_VALORES_FRONTEND: CampoEstimacion[] = [
  {
    key: 'analisisFuncional',
    label: 'Análisis Funcional',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'analisisTecnico',
    label: 'Análisis Técnico',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'pruebasUnitarias',
    label: 'Pruebas Unitarias',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'pruebasIntegracion',
    label: 'Pruebas de Integración',
    porcentaje: 10,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'implementacionYSoporte',
    label: 'Implementación y Soporte',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'gestion',
    label: 'Gestión',
    porcentaje: 15,
    horas: null,
    modo: 'porcentaje',
    editing: false,
  },
  {
    key: 'documentacion',
    label: 'Documentación',
    porcentaje: undefined,
    horas: 8,
    modo: 'horas',
    editing: false,
  },
];

@Component({
  selector: 'app-estimador',
  templateUrl: './estimador.component.html',
  styleUrls: ['./estimador.component.css'],
  standalone: true,
  imports: [FormsModule, NgChartsModule, CommonModule, HttpClientModule],
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
  public pdfErrorMessage: string | null = null;

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

  appVersion: string | undefined;
  originalCamposBackend: CampoEstimacion[] = [];
  originalCamposFrontend: CampoEstimacion[] = [];

  constructor(
    private estimadorService: EstimadorService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      import('html2pdf.js').then((module) => {
        html2pdf = module.default;
      });
    }
  }

  getAppVersion(): Observable<any> {
    return this.http.get<any>('./assets/package.json');
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

    // Obtener la nueva posición de Y después de la primera tabla
    currentY = (doc as any).lastAutoTable.finalY + 0.25;

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

    currentY = (doc as any).lastAutoTable.finalY + 0.25;

    // Salto de página para Resumen de Tareas y Cálculos
    doc.addPage();
    currentY = margin;

    doc.setFontSize(14);
    doc.text('Resumen de Tareas y Cálculos', margin, currentY);
    currentY += 0.25;

    // Tablas de Backend
    if (this.totalBackendHoras > 0) {
      doc.setFontSize(12);
      currentY += 0.25;

      const backendTasks = this.tareas.map((t) => [
        t.nombre,
        t.microservice || this.formData.microservicioBackend,
        `${t.horas} Hs.`,
      ]);
      if (this.desarrolloHoras) {
        backendTasks.push([
          'Horas de Desarrollo Backend',
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
        styles: { fontSize: 10 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 0.25;
    }

    // Tablas de Frontend
    if (this.totalFrontendHoras > 0) {
      doc.setFontSize(12);
      currentY += 0.25;

      const frontendTasks = this.tareasFrontend.map((t) => [
        t.nombre,
        t.microservice || this.formData.microservicioFrontend,
        `${t.horas} Hs.`,
      ]);
      if (this.frontendHoras) {
        frontendTasks.push([
          'Horas de Desarrollo Frontend',
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
        styles: { fontSize: 10 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 0.25;
    }

    // Cálculo Análisis
    if (this.totalCalculoBackend > 0 || this.totalCalculoFrontend > 0) {
      doc.setFontSize(14);
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

      currentY = (doc as any).lastAutoTable.finalY + 0.25;
    }

    // Desarrollo / Cálculo
    if (this.totalBackendHoras > 0 || this.totalFrontendHoras > 0) {
      doc.setFontSize(14);
      currentY += 0.25;

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

    this.getAppVersion().subscribe((data) => {
      this.appVersion = data.version;
    });
  }

  handleFrontendSwitch(): void {
    if (!this.showFrontend) {
      this.frontendHoras = null;
      this.showFrontendTareasCard = false;
    }
    this.calcularEstimacion();
  }

  // toggleConfiguracion(): void {
  //   this.showConfiguracion = !this.showConfiguracion;
  // }

  switchTab(tab: 'backend' | 'frontend'): void {
    this.activeTab = tab;
  }

  // guardarConfiguracion(): void {
  //   this.calcularEstimacion();
  //   this.toggleConfiguracion();
  // }

  updateEstimaciones(): void {
    this.camposEstimacionBackend.forEach((campoBackend) => {
      const campoFrontend = this.camposEstimacionFrontend.find(
        (c) => c.key === campoBackend.key
      );
      if (campoFrontend) {
        campoFrontend.label = campoBackend.label;
        campoFrontend.porcentaje = campoBackend.porcentaje;
        campoFrontend.horas = campoBackend.horas;
        campoFrontend.modo = campoBackend.modo;
      }
    });

    this.camposEstimacionFrontend.forEach((campoFrontend) => {
      const campoBackend = this.camposEstimacionBackend.find(
        (c) => c.key === campoFrontend.key
      );
      if (campoBackend) {
        campoBackend.label = campoFrontend.label;
        campoBackend.porcentaje = campoFrontend.porcentaje;
        campoBackend.horas = campoFrontend.horas;
        campoBackend.modo = campoFrontend.modo;
      }
    });

    // Recalcular todas las estimaciones y totalizar horas
    this.calcularEstimacion();
  }
  syncEstimacionesConCampos(): void {
    this.camposEstimacionBackend.forEach((campo) => {
      const keyBase = campo.key;
      if (campo.modo === 'porcentaje') {
        this.estimaciones[keyBase + 'Back'] = Math.round(
          (this.totalBackendHoras * (campo.porcentaje || 0)) / 100
        );
      } else {
        this.estimaciones[keyBase + 'Back'] = campo.horas || 0;
      }
      this.estimaciones[keyBase + 'Total'] =
        this.estimaciones[keyBase + 'Back'] +
        (this.estimaciones[keyBase + 'Front'] || 0);
    });

    this.camposEstimacionFrontend.forEach((campo) => {
      const keyBase = campo.key;
      if (campo.modo === 'porcentaje') {
        this.estimaciones[keyBase + 'Front'] = Math.round(
          (this.totalFrontendHoras * (campo.porcentaje || 0)) / 100
        );
      } else {
        this.estimaciones[keyBase + 'Front'] = campo.horas || 0;
      }
      this.estimaciones[keyBase + 'Total'] =
        this.estimaciones[keyBase + 'Front'] +
        (this.estimaciones[keyBase + 'Back'] || 0);
    });
  }

  guardarConfiguracion(): void {
    this.camposEstimacionBackend.forEach((campo) => {
      if (campo.editing) {
        campo.editing = false;
      }
    });
    this.camposEstimacionFrontend.forEach((campo) => {
      if (campo.editing) {
        campo.editing = false;
      }
    });

    this.updateEstimaciones();

    this.updatePieChartData();

    this.showConfiguracion = false;
  }

  toggleConfiguracion(): void {
    if (this.showConfiguracion) {
      this.camposEstimacionBackend = JSON.parse(
        JSON.stringify(this.originalCamposBackend)
      );
      this.camposEstimacionFrontend = JSON.parse(
        JSON.stringify(this.originalCamposFrontend)
      );
    } else {
      this.originalCamposBackend = JSON.parse(
        JSON.stringify(this.camposEstimacionBackend)
      );
      this.originalCamposFrontend = JSON.parse(
        JSON.stringify(this.camposEstimacionFrontend)
      );
    }
    this.showConfiguracion = !this.showConfiguracion;
  }

  isSaveDisabled(): boolean {
    return (
      this.camposEstimacionBackend.some((campo) => !campo.label.trim()) ||
      this.camposEstimacionFrontend.some((campo) => !campo.label.trim()) ||
      !this.isValidConfiguration()
    );
  }

  addNewItem(type: 'backend' | 'frontend'): void {
    const newItemKey =
      'nuevaEstimacion' +
      (type === 'backend'
        ? this.camposEstimacionBackend.length + 1
        : this.camposEstimacionFrontend.length + 1);

    const newItem: CampoEstimacion = {
      key: newItemKey,
      label: 'Nueva Propiedad',
      porcentaje: 10,
      horas: 0,
      modo: 'porcentaje',
      editing: false,
    };

    if (type === 'backend') {
      this.camposEstimacionBackend.push(newItem);
      const copiedItem = { ...newItem };
      this.camposEstimacionFrontend.push(copiedItem);
    } else {
      this.camposEstimacionFrontend.push(newItem);
      const copiedItem = { ...newItem };
      this.camposEstimacionBackend.push(copiedItem);
    }

    // Actualiza las estimaciones
    this.updateEstimaciones();

    // Actualiza los datos del gráfico de torta
    this.updatePieChartData();
  }

  removeItem(type: 'backend' | 'frontend', index: number): void {
    if (type === 'backend') {
      const itemKey = this.camposEstimacionBackend[index].key;
      this.camposEstimacionBackend.splice(index, 1);

      const frontendIndex = this.camposEstimacionFrontend.findIndex(
        (campo) => campo.key === itemKey
      );
      if (frontendIndex !== -1) {
        this.camposEstimacionFrontend.splice(frontendIndex, 1);
      }
    } else {
      const itemKey = this.camposEstimacionFrontend[index].key;
      this.camposEstimacionFrontend.splice(index, 1);

      const backendIndex = this.camposEstimacionBackend.findIndex(
        (campo) => campo.key === itemKey
      );
      if (backendIndex !== -1) {
        this.camposEstimacionBackend.splice(backendIndex, 1);
      }
    }

    this.updateEstimaciones();
  }

  updateField(field: CampoEstimacion, type: 'backend' | 'frontend'): void {
    // Actualizar el campo en la lista correspondiente
    if (type === 'backend') {
      const frontendField = this.camposEstimacionFrontend.find(
        (campo) => campo.key === field.key
      );
      if (frontendField) {
        frontendField.label = field.label;
        frontendField.porcentaje = field.porcentaje;
        frontendField.horas = field.horas;
        frontendField.modo = field.modo;
      }
    } else {
      const backendField = this.camposEstimacionBackend.find(
        (campo) => campo.key === field.key
      );
      if (backendField) {
        backendField.label = field.label;
        backendField.porcentaje = field.porcentaje;
        backendField.horas = field.horas;
        backendField.modo = field.modo;
      }
    }

    this.updateEstimaciones();
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
      const porcentaje = campo.porcentaje ?? 0;
      this.estimaciones[campo.key + 'Back'] =
        campo.modo === 'porcentaje'
          ? Math.round((this.totalBackendHoras * porcentaje) / 100)
          : campo.horas ?? 0;

      this.estimaciones[campo.key + 'Total'] =
        (this.estimaciones[campo.key + 'Back'] || 0) +
        (this.estimaciones[campo.key + 'Front'] || 0);
      this.totalCalculoBackend += this.estimaciones[campo.key + 'Back'];
    });

    this.camposEstimacionFrontend.forEach((campo) => {
      const porcentaje = campo.porcentaje ?? 0;
      this.estimaciones[campo.key + 'Front'] =
        campo.modo === 'porcentaje'
          ? Math.round((this.totalFrontendHoras * porcentaje) / 100)
          : campo.horas ?? 0;

      this.estimaciones[campo.key + 'Total'] =
        (this.estimaciones[campo.key + 'Back'] || 0) +
        (this.estimaciones[campo.key + 'Front'] || 0);
      this.totalCalculoFrontend += this.estimaciones[campo.key + 'Front'];
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
      const data: any[] = [];
      const labels: string[] = [];

      // Campos fijos (que siempre aparecen en el gráfico)
      const camposFijos = [
        'analisisFuncionalTotal',
        'analisisTecnicoTotal',
        'desarrolloBackend',
        'desarrolloFront',
        'pruebasUnitariasTotal',
        'pruebasIntegracionTotal',
        'implementacionYSoporteTotal',
        'gestionTotal',
        'documentacionTotal',
      ];

      camposFijos.forEach((campo, index) => {
        const value = this.estimaciones[campo] || 0;
        if (value > 0) {
          data.push(value);
          labels.push(this.pieChartLabels[index]);
        }
      });

      // Evitar duplicados al iterar sobre camposEstimacionBackend
      this.camposEstimacionBackend.forEach((campo) => {
        const totalKey = campo.key + 'Total';
        const indexInFixed = camposFijos.indexOf(totalKey);
        if (this.estimaciones[totalKey] > 0 && indexInFixed === -1) {
          data.push(this.estimaciones[totalKey]);
          labels.push(campo.label);
        }
      });

      this.pieChartData = {
        labels: labels,
        datasets: [{ data }],
      };
    } else {
      this.pieChartData = {
        labels: [],
        datasets: [{ data: [] }],
      };
    }
  }

  hasTasks(type: 'backend' | 'frontend'): boolean {
    if (type === 'backend') {
      return this.tareas.length > 0;
    } else if (type === 'frontend') {
      return this.tareasFrontend.length > 0;
    }
    return false;
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
        this.showMicroservicesModalFrontend = false; // Cierra el modal después de guardar
      }
    }
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

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

        if (
          !pdfText.includes('Registro de Cambios') &&
          !pdfText.includes('Resumen de Tareas y Cálculos')
        ) {
          this.pdfErrorMessage = 'El PDF no pertenece a esta aplicación';
          return;
        }

        let parsedData: any;
        this.pdfErrorMessage = null;

        if (
          pdfText.includes('Horas de Desarrollo Backend') &&
          pdfText.includes('Horas de Desarrollo Frontend') &&
          pdfText.includes('Total Backend') &&
          pdfText.includes('Total Frontend')
        ) {
          parsedData = this.parsePDFTextWithoutTasks(pdfText);
        } else if (
          pdfText.includes('Horas de Desarrollo Backend') &&
          !pdfText.includes('Horas de Desarrollo Frontend') &&
          pdfText.includes('Total Backend') &&
          pdfText.includes('Total Frontend')
        ) {
          parsedData =
            this.parsePDFTextWithBackendHoursAndFrontendTasks(pdfText);
        } else if (
          !pdfText.includes('Horas de Desarrollo Backend') &&
          pdfText.includes('Horas de Desarrollo Frontend') &&
          pdfText.includes('Total Backend') &&
          pdfText.includes('Total Frontend')
        ) {
          parsedData =
            this.parsePDFTextWithFrontendHoursAndBackendTasks(pdfText);
        } else if (
          !pdfText.includes('Horas de Desarrollo Backend') &&
          !pdfText.includes('Horas de Desarrollo Frontend') &&
          pdfText.includes('Total Backend') &&
          pdfText.includes('Total Frontend')
        ) {
          parsedData = this.parsePDFTextWithBackendAndFrontend(pdfText);
        } else if (
          pdfText.includes('Horas de Desarrollo Backend') &&
          !pdfText.includes('Horas de Desarrollo Frontend') &&
          pdfText.includes('Total Backend') &&
          !pdfText.includes('Total Frontend')
        ) {
          parsedData = this.parsePDFJustBackend(pdfText);
        } else if (
          !pdfText.includes('Horas de Desarrollo Backend') &&
          pdfText.includes('Horas de Desarrollo Frontend') &&
          !pdfText.includes('Total Backend') &&
          pdfText.includes('Total Frontend')
        ) {
          parsedData = this.parsePDFJustFrontend(pdfText);
        } else {
          parsedData = this.parsePDFText(pdfText);
        }

        console.log(pdfText);

        this.fillFormWithExtractedData(pdfText);
        // Manejar horas de Backend si no hay tareas
        if (parsedData.totalBackend) {
          this.desarrolloHoras = parseInt(parsedData.totalBackend);
          this.showTareasCard = this.desarrolloHoras > 0;
        }

        if (parsedData.totalFrontend) {
          this.frontendHoras = parseInt(parsedData.totalFrontend);
          this.showFrontendTareasCard = this.frontendHoras > 0;
          this.showFrontend = this.frontendHoras > 0;
        }

        // Manejar tareas de Backend
        if (
          parsedData.resumenTareasCalculos &&
          parsedData.resumenTareasCalculos.tareas &&
          parsedData.resumenTareasCalculos.tareas.length > 0
        ) {
          this.tareas = parsedData.resumenTareasCalculos.tareas.map(
            (t: any) => ({
              nombre: t.tarea,
              horas: parseInt(t.horas.replace(' Hs.', '')),
              microservice: t.microservicio,
            })
          );
          this.showTareasCard = true;
        } else {
          this.showTareasCard = false;
        }

        // Manejar tareas de Frontend
        if (
          parsedData.resumenTareasCalculos &&
          parsedData.resumenTareasCalculos.tareasFrontend &&
          parsedData.resumenTareasCalculos.tareasFrontend.length > 0
        ) {
          this.tareasFrontend =
            parsedData.resumenTareasCalculos.tareasFrontend.map((t: any) => ({
              nombre: t.tarea,
              horas: parseInt(t.horas.replace(' Hs.', '')),
              microservice: t.microservicio,
            }));
          this.showFrontendTareasCard = true;
          this.showFrontend = true;
        } else {
          this.showFrontendTareasCard = false;
          if (!this.frontendHoras) {
            this.showFrontend = false;
          }
        }

        // Procesar Desarrollo/Análisis
        if (parsedData.desarrolloAnalisis) {
          parsedData.desarrolloAnalisis.desarrollo.forEach((d: any) => {
            if (d.tipo === 'Desarrollo') {
              if (!this.tareasFrontend.length) {
                this.frontendHoras = parseInt(d.frontend.replace(' Hs.', ''));
              }
              if (!this.tareas.length) {
                this.desarrolloHoras = parseInt(d.backend.replace(' Hs.', ''));
              }
            }
          });

          this.totalHoras = parseInt(
            parsedData.desarrolloAnalisis.totalEstimacion.replace(' Hs.', '')
          );
        }

        // Actualizar las estimaciones y el gráfico
        this.calcularEstimacion();
        this.updatePieChartData();

        this.closeUploadModal();
      };

      reader.readAsArrayBuffer(this.uploadedFile);
    }
  }

  parsePDFText(pdfText: string): any {
    if (this.frontendHoras || this.desarrolloHoras) {
      this.frontendHoras = null;
      this.desarrolloHoras = null;
    }
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
    const changesSectionMatch = pdfText.match(
      /Registro de Cambios\s+Versión\s+Causa del cambio\s+Responsable del cambio\s+Fecha del cambio\s+([\s\S]+?)(?:\n|Resumen de Tareas y Cálculos)/
    );

    if (changesSectionMatch) {
      const changesLines = changesSectionMatch[1].split('\n').filter(Boolean);

      result.registroCambios = changesLines
        .map((line) => {
          const changeMatch = line.match(
            /(\d+\.\d+)\s+(.+?)\s+(\w+)\s+([\d/]+)/
          );
          return changeMatch
            ? {
                version: changeMatch[1].trim(),
                causaDelCambio: changeMatch[2].trim(),
                responsableDelCambio: changeMatch[3].trim(),
                fechaDelCambio: changeMatch[4].trim(),
              }
            : null;
        })
        .filter((change) => change !== null);
    } else {
      result.registroCambios = [];
    }

    // Extraer tareas y cálculos para Backend y Frontend
    const backendTasksMatch = pdfText.match(
      /Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Backend\s+([\d]+\s+Hs.)/
    );
    const frontendTasksMatch = pdfText.match(
      /Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Frontend\s+([\d]+\s+Hs.)/
    );

    if (backendTasksMatch) {
      const backendTasks = backendTasksMatch[1]
        .split(/(\d+\s+Hs\.)/) // Dividir por cada ocurrencia de "XX Hs."
        .reduce(
          (acc: any[], current: string, index: number, array: string[]) => {
            if (index % 2 === 0) {
              const taskLine = current.trim();
              const taskMatch = taskLine.match(/^(.+?)\s{2,}([\w\s]+)$/);
              if (taskMatch) {
                acc.push({
                  tarea: taskMatch[1].trim(),
                  microservicio: taskMatch[2].trim(),
                  horas: array[index + 1].trim(), // El siguiente elemento es las horas
                });
              }
            }
            return acc;
          },
          []
        )
        .filter((task) => task !== null);

      // Verificar si todos los microservicios son iguales
      const allBackendMicroservicesSame = backendTasks.every(
        (task) => task?.microservicio === backendTasks[0]?.microservicio
      );

      const parsedBackendTasks = allBackendMicroservicesSame
        ? backendTasks.map(({ microservicio, ...rest }) => rest)
        : backendTasks;

      result.resumenTareasCalculos = {
        tareas: parsedBackendTasks,
        totalBackend: backendTasksMatch[2].trim(),
      };

      // Asignar microservicio de Backend
      this.formData.microservicioBackend =
        backendTasks[0]?.microservicio || null;

      // Guardar microservicios en el array si hay más de uno diferente
      const uniqueBackendMicroservices = Array.from(
        new Set(backendTasks.map((task) => task?.microservicio))
      ).filter((microservicio): microservicio is string => !!microservicio);

      if (uniqueBackendMicroservices.length > 1) {
        this.microservicesBackend.push(...uniqueBackendMicroservices);
      }
    }

    if (frontendTasksMatch) {
      const frontendTasks = frontendTasksMatch[1]
        .split(/(\d+\s+Hs\.)/) // Dividir por cada ocurrencia de "XX Hs."
        .reduce(
          (acc: any[], current: string, index: number, array: string[]) => {
            if (index % 2 === 0) {
              const taskLine = current.trim();
              const taskMatch = taskLine.match(/^(.+?)\s{2,}([\w\s]+)$/);
              if (taskMatch) {
                acc.push({
                  tarea: taskMatch[1].trim(),
                  microservicio: taskMatch[2].trim(),
                  horas: array[index + 1].trim(), // El siguiente elemento es las horas
                });
              }
            }
            return acc;
          },
          []
        )
        .filter((task) => task !== null);

      // Verificar si todos los microservicios son iguales
      const allFrontendMicroservicesSame = frontendTasks.every(
        (task) => task?.microservicio === frontendTasks[0]?.microservicio
      );

      const parsedFrontendTasks = allFrontendMicroservicesSame
        ? frontendTasks.map(({ microservicio, ...rest }) => rest)
        : frontendTasks;

      if (!result.resumenTareasCalculos) {
        result.resumenTareasCalculos = {};
      }

      result.resumenTareasCalculos.tareasFrontend = parsedFrontendTasks;
      result.resumenTareasCalculos.totalFrontend = frontendTasksMatch[2].trim();

      // Asignar microservicio de Frontend
      this.formData.microservicioFrontend =
        frontendTasks[0]?.microservicio || null;

      // Guardar microservicios en el array si hay más de uno diferente
      const uniqueFrontendMicroservices = Array.from(
        new Set(frontendTasks.map((task) => task?.microservicio))
      ).filter((microservicio): microservicio is string => !!microservicio);

      if (uniqueFrontendMicroservices.length > 1) {
        this.microservicesFrontend.push(...uniqueFrontendMicroservices);
      }
    }

    return result;
  }

  parsePDFTextWithBackendAndFrontend(pdfText: string): any {
    if (this.frontendHoras || this.desarrolloHoras) {
      this.frontendHoras = null;
      this.desarrolloHoras = null;
    }
    const result: any = {};

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

    // Separar la sección de Backend y Frontend
    const tasksMatch = pdfText.match(
      /Resumen de Tareas y Cálculos\s+Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Backend\s+(\d+\s+Hs\.)\s+Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Frontend\s+(\d+\s+Hs\.)/
    );

    if (tasksMatch) {
      const backendSection = tasksMatch[1].trim();
      const totalBackend = tasksMatch[2].trim();
      const frontendSection = tasksMatch[3].trim();
      const totalFrontend = tasksMatch[4].trim();

      // Ajustar la extracción de tareas Backend
      const backendTasks = backendSection
        .split(/(?<=Hs\.)/) // Usar "Hs." como delimitador
        .map((task) => {
          const taskMatch = task
            .trim()
            .match(/(.+?)\s{2,}(.+?)\s+(\d+\s+Hs\.)$/);
          return taskMatch
            ? {
                tarea: taskMatch[1].trim(),
                microservicio: taskMatch[2].trim(),
                horas: taskMatch[3].trim(),
              }
            : null;
        })
        .filter((task) => task !== null);

      // Verificar si todos los microservicios son iguales en Backend
      const allBackendMicroservicesSame = backendTasks.every(
        (task) => task?.microservicio === backendTasks[0]?.microservicio
      );

      // Guardar los microservicios únicos de Backend
      const uniqueBackendMicroservices = Array.from(
        new Set(backendTasks.map((task) => task?.microservicio))
      ).filter((microservicio): microservicio is string => !!microservicio);

      if (uniqueBackendMicroservices.length > 1) {
        this.microservicesBackend.push(...uniqueBackendMicroservices);
      }

      const parsedBackendTasks = allBackendMicroservicesSame
        ? backendTasks.map((task) => {
            const { microservicio, ...rest } = task as {
              tarea: string;
              microservicio: string;
              horas: string;
            };
            return rest;
          })
        : backendTasks;

      // Ajustar la extracción de tareas Frontend
      const frontendTasks = frontendSection
        .split(/(?<=Hs\.)/) // Usar "Hs." como delimitador
        .map((task) => {
          const taskMatch = task
            .trim()
            .match(/(.+?)\s{2,}(.+?)\s+(\d+\s+Hs\.)$/);
          return taskMatch
            ? {
                tarea: taskMatch[1].trim(),
                microservicio: taskMatch[2].trim(),
                horas: taskMatch[3].trim(),
              }
            : null;
        })
        .filter((task) => task !== null);

      // Verificar si todos los microservicios son iguales en Frontend
      const allFrontendMicroservicesSame = frontendTasks.every(
        (task) => task?.microservicio === frontendTasks[0]?.microservicio
      );

      // Guardar los microservicios únicos de Frontend
      const uniqueFrontendMicroservices = Array.from(
        new Set(frontendTasks.map((task) => task?.microservicio))
      ).filter((microservicio): microservicio is string => !!microservicio);

      if (uniqueFrontendMicroservices.length > 1) {
        this.microservicesFrontend.push(...uniqueFrontendMicroservices);
      }

      result.resumenTareasCalculos = {
        tareas: parsedBackendTasks,
        totalBackend,
        tareasFrontend: allFrontendMicroservicesSame
          ? frontendTasks
              .filter(
                (
                  task
                ): task is {
                  tarea: string;
                  microservicio: string;
                  horas: string;
                } => task !== null
              )
              .map(({ tarea, horas }) => ({ tarea, horas }))
          : frontendTasks,
        totalFrontend,
      };

      // Asignar microservicio de Backend y Frontend
      this.formData.microservicioBackend = backendTasks[0]?.microservicio || '';
      this.formData.microservicioFrontend =
        frontendTasks[0]?.microservicio || '';
    }

    return result;
  }

  parsePDFTextWithoutTasks(pdfText: string): any {
    if (this.frontendHoras || this.desarrolloHoras) {
      this.frontendHoras = null;
      this.desarrolloHoras = null;
    }
    const result: any = {};
    // Extraer horas de desarrollo backend
    const backendHoursMatch = pdfText.match(/Total Backend\s+(\d+)\s+Hs\./);
    const frontendHoursMatch = pdfText.match(/Total Frontend\s+(\d+)\s+Hs\./);

    if (backendHoursMatch) {
      result.totalBackend = backendHoursMatch[1].trim(); // Solo el número
      const backendMicroserviceMatch = pdfText.match(
        /Horas de Desarrollo Backend\s+(.+?)\s+\d+\s+Hs\./
      );
      this.formData.microservicioBackend = backendMicroserviceMatch
        ? backendMicroserviceMatch[1].trim()
        : '';
    }

    if (frontendHoursMatch) {
      result.totalFrontend = frontendHoursMatch[1].trim(); // Solo el número
      const frontendMicroserviceMatch = pdfText.match(
        /Horas de Desarrollo Frontend\s+(.+?)\s+\d+\s+Hs\./
      );
      this.formData.microservicioFrontend = frontendMicroserviceMatch
        ? frontendMicroserviceMatch[1].trim()
        : '';
    }

    return result;
  }

  parsePDFJustBackend(pdfText: string): any {
    const result: any = {};
    // Extraer horas de desarrollo backend
    if (this.frontendHoras || this.desarrolloHoras) {
      this.frontendHoras = null;
      this.desarrolloHoras = null;
    }

    const backendHoursMatch = pdfText.match(/Total Backend\s+(\d+)\s+Hs\./);
    if (backendHoursMatch) {
      result.totalBackend = backendHoursMatch[1].trim(); // Solo el número
      const backendMicroserviceMatch = pdfText.match(
        /Horas de Desarrollo Backend\s+(.+?)\s+\d+\s+Hs\./
      );
      this.formData.microservicioBackend = backendMicroserviceMatch
        ? backendMicroserviceMatch[1].trim()
        : '';
      result.totalFrontend = null;
    }

    return result;
  }

  parsePDFJustFrontend(pdfText: string): any {
    const result: any = {};
    const frontendHoursMatch = pdfText.match(/Total Frontend\s+(\d+)\s+Hs\./);

    if (this.frontendHoras || this.desarrolloHoras) {
      this.frontendHoras = null;
      this.desarrolloHoras = null;
    }

    if (frontendHoursMatch) {
      result.totalFrontend = frontendHoursMatch[1].trim();
      const frontendMicroserviceMatch = pdfText.match(
        /Horas de Desarrollo Frontend\s+(.+?)\s+\d+\s+Hs\./
      );
      this.formData.microservicioFrontend = frontendMicroserviceMatch
        ? frontendMicroserviceMatch[1].trim()
        : '';
      result.totalBackend = null;
    }

    return result;
  }

  parsePDFTextWithBackendHoursAndFrontendTasks(
    pdfText: string,
    taskRegex?: RegExp
  ): any {
    const result: any = {};

    // Extraer horas de desarrollo backend
    const backendHoursMatch = pdfText.match(/Total Backend\s+(\d+\s+Hs\.)/);
    if (backendHoursMatch) {
      result.totalBackend = backendHoursMatch[1].replace(' Hs.', '').trim();
      const backendMicroserviceMatch = pdfText.match(
        /Horas de Desarrollo Backend\s+(.+?)\s+\d+\s+Hs\./
      );
      this.formData.microservicioBackend = backendMicroserviceMatch
        ? backendMicroserviceMatch[1].trim()
        : '';
    }

    // Extraer tareas frontend
    const frontendTasksMatch = pdfText.match(
      /Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Frontend\s+(\d+\s+Hs\.)/
    );
    if (frontendTasksMatch) {
      const frontendTasks = frontendTasksMatch[1]
        .split(/(\d+\s+Hs\.)/)
        .reduce(
          (acc: any[], current: string, index: number, array: string[]) => {
            if (index % 2 === 0) {
              const taskLine = current.trim();

              // Filtrar las tareas que no corresponden a "Horas de Desarrollo"
              if (!taskLine.includes('Horas de Desarrollo Backend')) {
                // Ajustar la expresión regular para capturar la tarea completa
                const taskRegexToUse =
                  taskRegex || /Tarea\s+.+?\s+Horas\s+(.+?)\s{2,}(.+?)$/;
                const taskMatch = taskLine.match(taskRegexToUse);

                if (taskMatch) {
                  acc.push({
                    tarea: taskMatch[1].trim(), // Captura el nombre completo de la tarea "Tarea Front 1"
                    microservicio: taskMatch[2].trim(), // Captura el microservicio "Front"
                    horas: array[index + 1].trim(),
                  });
                }
              }
            }
            return acc;
          },
          []
        )
        .filter((task) => task !== null);

      // Verificar si todos los microservicios son iguales
      const allFrontendMicroservicesSame = frontendTasks.every(
        (task) => task.microservicio === frontendTasks[0].microservicio
      );

      // Verificar si hay más de un microservicio diferente en Frontend
      const uniqueFrontendMicroservices = Array.from(
        new Set(frontendTasks.map((task) => task.microservicio))
      );
      if (uniqueFrontendMicroservices.length > 1) {
        this.microservicesFrontend.push(...uniqueFrontendMicroservices);
      }

      result.resumenTareasCalculos = {
        tareasFrontend: frontendTasks,
        totalFrontend: frontendTasksMatch[2].replace(' Hs.', '').trim(),
      };

      // Asignar el microservicio frontend
      if (allFrontendMicroservicesSame && frontendTasks.length > 0) {
        this.formData.microservicioFrontend = frontendTasks[0].microservicio;
      }
    }

    return result;
  }

  parsePDFTextWithFrontendHoursAndBackendTasks(pdfText: string): any {
    const result: any = {};

    // Extraer horas de desarrollo frontend
    const frontendHoursMatch = pdfText.match(/Total Frontend\s+(\d+\s+Hs\.)/);
    if (frontendHoursMatch) {
      result.totalFrontend = frontendHoursMatch[1].replace(' Hs.', '').trim();
      const frontendMicroserviceMatch = pdfText.match(
        /Horas de Desarrollo Frontend\s+(.+?)\s+\d+\s+Hs\./
      );
      this.formData.microservicioFrontend = frontendMicroserviceMatch
        ? frontendMicroserviceMatch[1].trim()
        : '';
    }

    // Extraer tareas backend
    const backendTasksMatch = pdfText.match(
      /Tarea\s+Microservicio\s+Horas\s+([\s\S]+?)Total Backend\s+(\d+\s+Hs\.)/
    );
    if (backendTasksMatch) {
      const tareas = backendTasksMatch[1]
        .split(/(\d+\s+Hs\.)/)
        .reduce(
          (acc: any[], current: string, index: number, array: string[]) => {
            if (index % 2 === 0) {
              const taskLine = current.trim();
              const taskMatch = taskLine.match(/^(.+?)\s{2,}([\w\s]+)$/);
              if (taskMatch) {
                acc.push({
                  tarea: taskMatch[1].trim(),
                  microservicio: taskMatch[2].trim(),
                  horas: array[index + 1].trim(),
                });
              }
            }
            return acc;
          },
          []
        )
        .filter((task) => task !== null);

      // Verificar si todos los microservicios son iguales
      const allBackendMicroservicesSame = tareas.every(
        (task) => task.microservicio === tareas[0].microservicio
      );

      // Verificar si hay más de un microservicio diferente en Backend
      const uniqueBackendMicroservices = Array.from(
        new Set(tareas.map((task) => task.microservicio))
      );
      if (uniqueBackendMicroservices.length > 1) {
        this.microservicesBackend.push(...uniqueBackendMicroservices);
      }

      result.resumenTareasCalculos = {
        tareas: tareas,
        totalBackend: backendTasksMatch[2].trim(),
      };

      // Asignar nombre del microservicio Backend
      this.formData.microservicioBackend = tareas[0]?.microservicio || '';
    }

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

  extractDataFromPDF(pdfText: string): any {
    const result: any = {};

    // Localizar la posición de la palabra "Proyecto"
    const projectStartIndex = pdfText.indexOf('Proyecto');

    if (projectStartIndex !== -1) {
      // Capturar el título que viene antes de "Proyecto"
      result.tituloDocumento = pdfText
        .substring(0, projectStartIndex)
        .replace(/^Page \d+:\s*/, '')
        .trim();

      // Obtener el texto desde "Proyecto" hasta el final de la primera sección
      const endOfSectionIndex =
        pdfText.indexOf('Registro de Cambios') !== -1
          ? pdfText.indexOf('Registro de Cambios')
          : pdfText.indexOf('Resumen de Tareas y Cálculos');
      const cleanedText = pdfText
        .substring(projectStartIndex, endOfSectionIndex)
        .trim();

      // Extraer los valores de Proyecto, Autor, Versión y Descripción
      const proyectoMatch = cleanedText.match(/Proyecto\s+(.+?)\s+Autor/);
      const autorMatch = cleanedText.match(/Autor\s+(.+?)\s+Versión/);
      const versionMatch = cleanedText.match(/Versión\s+(.+?)\s+Descripción/);
      const descripcionMatch = cleanedText.match(/Descripción\s+(.+)/);

      // Si se encontraron las coincidencias, asignarlas a las variables
      result.proyecto = proyectoMatch ? proyectoMatch[1].trim() : '';
      result.nombreDesarrollador = autorMatch
        ? autorMatch[1].replace(/\s+\d+\.\d+$/, '').trim() // Remover el "1.0"
        : '';
      result.version = ''; // Eliminar la versión del parseo
      result.descripcion = descripcionMatch ? descripcionMatch[1].trim() : '';

      // Si no se encontraron las coincidencias, usar la información de "descripcion"
      const parts = result.descripcion.split(/\s{2,}/);

      if (parts.length >= 3) {
        result.proyecto = parts[0].trim();
        result.nombreDesarrollador = parts[1]
          .replace(/\s+\d+\.\d+$/, '')
          .trim(); // Remover el "1.0"
        result.descripcion = parts.slice(2).join(' ').trim();
      }
    }

    // Eliminar cualquier ocurrencia de "1.0" en el resultado final
    for (const key in result) {
      if (typeof result[key] === 'string') {
        result[key] = result[key].replace(/\b1\.0\b/g, '').trim();
      }
    }

    console.log(result);

    return result;
  }

  fillFormWithExtractedData(pdfText: string): void {
    const extractedData = this.extractDataFromPDF(pdfText);

    this.formData.tituloDocumento = extractedData.tituloDocumento || '';
    this.formData.proyecto = extractedData.proyecto || '';
    this.formData.desarrolladores = [extractedData.nombreDesarrollador] || [''];
    //this.formData.version = extractedData.version || '';
    this.formData.descripcion = extractedData.descripcion || '';
  }
}
