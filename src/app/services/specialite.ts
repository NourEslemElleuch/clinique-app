import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Specialite } from '../models/specialite.model';

@Injectable({ providedIn: 'root' })
export class SpecialiteService {

  constructor(private firestore: Firestore) {}

  getSpecialites(): Observable<Specialite[]> {
    return collectionData(collection(this.firestore, 'specialites'), { idField: 'id' }) as Observable<Specialite[]>;
  }

  addSpecialite(specialite: Specialite) {
    return addDoc(collection(this.firestore, 'specialites'), specialite);
  }

  updateSpecialite(id: string, specialite: Partial<Specialite>) {
    return updateDoc(doc(this.firestore, 'specialites', id), specialite);
  }

  deleteSpecialite(id: string) {
    return deleteDoc(doc(this.firestore, 'specialites', id));
  }
}