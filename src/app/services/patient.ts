import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Patient } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {

  constructor(private firestore: Firestore) {}

  // Récupérer tous les patients en temps réel
  getPatients(): Observable<Patient[]> {
    return collectionData(collection(this.firestore, 'patients'), { idField: 'id' }) as Observable<Patient[]>;
  }

  // Récupérer un patient par ID
  getPatient(id: string): Observable<Patient> {
    return docData(doc(this.firestore, 'patients', id), { idField: 'id' }) as Observable<Patient>;
  }

  // Ajouter
  addPatient(patient: Patient) {
    return addDoc(collection(this.firestore, 'patients'), patient);
  }

  // Modifier
  updatePatient(id: string, patient: Partial<Patient>) {
    return updateDoc(doc(this.firestore, 'patients', id), patient);
  }

  // Supprimer
  deletePatient(id: string) {
    return deleteDoc(doc(this.firestore, 'patients', id));
  }
}