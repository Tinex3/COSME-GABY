export interface User {
  id: string;
  email: string;
  nombre: string;
  roles: string[];
  profile?: ProfessionalProfile | null;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  nombrePublico: string;
  titulo: string;
  bio: string;
  especialidades: string[];
  fotoUrl?: string | null;
  comuna: string;
  lat: number;
  lng: number;
  verificado: boolean;
  activo: boolean;
  user?: { nombre: string; email?: string };
  reviews?: Review[];
  offerings?: ServiceOffering[];
  credential?: {
    estado: string;
    tipo: string;
    numeroRegistro?: string;
    archivoUrl?: string | null;
  } | null;
}

export interface Treatment {
  id: string;
  nombre: string;
  slug: string;
  categoria: string;
  duracionMin: number;
  precioClp: number;
  descripcion: string;
}

export interface ServiceOffering {
  id: string;
  treatmentId: string;
  precioCustom?: number | null;
  duracionCustom?: number | null;
  treatment: Treatment;
}

export interface Review {
  id: string;
  rating: number;
  texto: string;
  createdAt: string;
  patient?: { nombre: string };
  professional?: { nombrePublico: string };
  appointmentId?: string;
}

export interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  estado: 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_PRESENTADO';
  vista?: 'PACIENTE' | 'ESPECIALISTA';
  treatment: Treatment;
  patient?: { id: string; nombre: string; email: string };
  professional?: { id: string; user?: { nombre: string } };
  review?: { id: string } | null;
}

export interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumen: string;
  body?: string;
  coverUrl?: string | null;
  createdAt: string;
}

export interface AvailabilityRule {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface AvailabilityException {
  id: string;
  fecha: string;
  tipo: 'BLOQUEO' | 'HORARIO_EXTRA';
  horaInicio?: string | null;
  horaFin?: string | null;
}

export interface ForumCategory {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  _count?: { topics: number };
}

export interface ForumTopic {
  id: string;
  titulo: string;
  contenido: string;
  cerrado: boolean;
  createdAt: string;
  category: { nombre: string; slug: string };
  author: { nombre: string };
  _count?: { replies: number };
  replies?: ForumReply[];
}

export interface ForumReply {
  id: string;
  contenido: string;
  createdAt: string;
  author: { nombre: string };
}

export interface ServiceOrder {
  id: string;
  folio: string;
  estado: 'PENDIENTE' | 'EN_ATENCION' | 'COMPLETADA' | 'CANCELADA';
  notas: string;
  createdAt: string;
  updatedAt: string;
  vista?: 'PACIENTE' | 'ESPECIALISTA';
  appointment: {
    startAt: string;
    treatment: { nombre: string; precioClp: number };
    patient: { id: string; nombre: string; email: string };
    professional: { user?: { nombre: string } };
  };
  events: OrderEvent[];
}

export interface OrderEvent {
  id: string;
  estado: string;
  comentario: string;
  createdAt: string;
  actor?: { nombre: string } | null;
}
