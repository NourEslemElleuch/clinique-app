export interface Medecin {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialiteId: string;
  specialiteNom?: string;
}