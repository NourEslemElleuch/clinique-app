export interface Ordonnance {
  id?: string;
  rendezVousId: string;
  patientId: string;
  medecinId: string;
  patientNom?: string;
  medecinNom?: string;
  date: string;
  medicaments: string;
  instructions: string;
}