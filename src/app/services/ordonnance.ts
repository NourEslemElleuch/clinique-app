import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { Ordonnance } from '../models/ordonnance.model';
import { PatientService } from './patient';
import { MedecinService } from './medecin';

@Injectable({ providedIn: 'root' })
export class OrdonnanceService {

  constructor(
    private firestore: Firestore,
    private patientService: PatientService,
    private medecinService: MedecinService
  ) {}

  // Ordonnances avec noms (jointure)
  getOrdonnancesAvecDetails(): Observable<Ordonnance[]> {
    const ord$ = collectionData(collection(this.firestore, 'ordonnances'), { idField: 'id' }) as Observable<Ordonnance[]>;

    return combineLatest([ord$, this.patientService.getPatients(), this.medecinService.getMedecins()]).pipe(
      map(([ords, patients, medecins]) =>
        ords.map(ord => ({
          ...ord,
          patientNom: patients.find(p => p.id === ord.patientId)?.nom + ' ' + patients.find(p => p.id === ord.patientId)?.prenom,
          medecinNom: 'Dr. ' + medecins.find(m => m.id === ord.medecinId)?.nom
        }))
      )
    );
  }

  addOrdonnance(ord: Ordonnance) {
    return addDoc(collection(this.firestore, 'ordonnances'), ord);
  }

  updateOrdonnance(id: string, ord: Partial<Ordonnance>) {
    return updateDoc(doc(this.firestore, 'ordonnances', id), ord);
  }

  deleteOrdonnance(id: string) {
    return deleteDoc(doc(this.firestore, 'ordonnances', id));
  }
}