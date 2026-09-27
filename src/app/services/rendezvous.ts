import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { RendezVous } from '../models/rendezvous.model';
import { PatientService } from './patient';
import { MedecinService } from './medecin';

@Injectable({ providedIn: 'root' })
export class RendezVousService {

  constructor(
    private firestore: Firestore,
    private patientService: PatientService,
    private medecinService: MedecinService
  ) {}

  // RDV avec noms du patient et médecin (jointure)
  getRendezVousAvecDetails(): Observable<RendezVous[]> {
    const rdvs$ = collectionData(collection(this.firestore, 'rendezvous'), { idField: 'id' }) as Observable<RendezVous[]>;

    return combineLatest([rdvs$, this.patientService.getPatients(), this.medecinService.getMedecins()]).pipe(
      map(([rdvs, patients, medecins]) =>
        rdvs.map(rdv => ({
          ...rdv,
          patientNom: patients.find(p => p.id === rdv.patientId)?.nom + ' ' + patients.find(p => p.id === rdv.patientId)?.prenom,
          medecinNom: 'Dr. ' + medecins.find(m => m.id === rdv.medecinId)?.nom
        }))
      )
    );
  }

  addRendezVous(rdv: RendezVous) {
    return addDoc(collection(this.firestore, 'rendezvous'), rdv);
  }

  updateRendezVous(id: string, rdv: Partial<RendezVous>) {
    return updateDoc(doc(this.firestore, 'rendezvous', id), rdv);
  }

  deleteRendezVous(id: string) {
    return deleteDoc(doc(this.firestore, 'rendezvous', id));
  }
}