import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Medecin } from '../models/medecin.model';

@Injectable({ providedIn: 'root' })
export class MedecinService {

  constructor(private firestore: Firestore) {}

  getMedecins(): Observable<Medecin[]> {
    return collectionData(collection(this.firestore, 'medecins'), { idField: 'id' }) as Observable<Medecin[]>;
  }

  addMedecin(medecin: Medecin) {
    return addDoc(collection(this.firestore, 'medecins'), medecin);
  }

  updateMedecin(id: string, medecin: Partial<Medecin>) {
    return updateDoc(doc(this.firestore, 'medecins', id), medecin);
  }

  deleteMedecin(id: string) {
    return deleteDoc(doc(this.firestore, 'medecins', id));
  }
}