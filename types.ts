export type Role = 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
  imageUrl?: string;
}

export enum UserLevel {
  Basico = 'Básico',
  Intermedio = 'Intermedio',
  Avanzado = 'Avanzado',
}

export enum Topic {
  PlanosAcotados = 'Sistema de Planos Acotados',
  Diedrico = 'Sistema Diédrico',
}