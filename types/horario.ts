export type Modalidad = 'VIRTUAL' | 'PRESENCIAL';

export interface ProfesorDTO {
  id: number;
  nombre: string;
  correo: string | null;
}

export interface AulaDTO {
  id: number;
  nombre: string;
  ubicacion: string | null;
  capacidad: number | null;
}

export interface HorarioDTO {
  id: number;
  curso: string;
  profesorId: number;
  profesor: string;
  aulaId: number | null;
  aula: string;
  modalidad: Modalidad;
  inicio: string;
  fin: string;
  color: string;
}

export interface HorarioFormData {
  curso: string;
  profesorId: string;
  modalidad: Modalidad;
  aulaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  color: string;
}