export interface RendezVous {
  id?: string;
  patientId: string;
  medecinId: string;
  patientNom?: string;
  medecinNom?: string;
  date: string;
  heure: string;
  motif: string;
  statut: 'planifié' | 'terminé' | 'annulé';
}