import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, getCountFromServer, collectionData } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { Patient } from '../models/patient.model';
import { Medecin } from '../models/medecin.model';
import { RendezVous } from '../models/rendezvous.model';
import { Specialite } from '../models/specialite.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private firestore = inject(Firestore);

  patientsCount = signal(0);
  medecinsCount = signal(0);
  rdvTodayCount = signal(0);
  ordonnancesCount = signal(0);

  // Chart data réels depuis Firebase
  patientsByGroupeSanguin$: Observable<{ label: string; count: number }[]>;
  medecinsBySpecialite$: Observable<{ label: string; count: number }[]>;
  rdvByStatut$: Observable<{ label: string; count: number }[]>;
  rdvMonthly$: Observable<number[]>;

  constructor() {
    const patients$ = collectionData(
      collection(this.firestore, 'patients'), { idField: 'id' }
    ) as Observable<Patient[]>;

    const medecins$ = collectionData(
      collection(this.firestore, 'medecins'), { idField: 'id' }
    ) as Observable<Medecin[]>;

    const rdvs$ = collectionData(
      collection(this.firestore, 'rendezvous'), { idField: 'id' }
    ) as Observable<RendezVous[]>;

    const specialites$ = collectionData(
      collection(this.firestore, 'specialites'), { idField: 'id' }
    ) as Observable<Specialite[]>;

    // Patients par groupe sanguin
    this.patientsByGroupeSanguin$ = patients$.pipe(
      map(patients => {
        const groups: { [key: string]: number } = {};
        patients.forEach(p => {
          const g = p.groupeSanguin || 'Inconnu';
          groups[g] = (groups[g] || 0) + 1;
        });
        return Object.entries(groups).map(([label, count]) => ({ label, count }));
      })
    );

    // Médecins par spécialité
    this.medecinsBySpecialite$ = combineLatest([medecins$, specialites$]).pipe(
      map(([medecins, specialites]) => {
        const groups: { [key: string]: number } = {};
        medecins.forEach(m => {
          const spec = specialites.find(s => s.id === m.specialiteId);
          const label = spec ? spec.nom : 'Non assignée';
          groups[label] = (groups[label] || 0) + 1;
        });
        return Object.entries(groups).map(([label, count]) => ({ label, count }));
      })
    );

    // RDV par statut
    this.rdvByStatut$ = rdvs$.pipe(
      map(rdvs => {
        const groups: { [key: string]: number } = { 'planifié': 0, 'terminé': 0, 'annulé': 0 };
        rdvs.forEach(r => {
          if (r.statut in groups) groups[r.statut]++;
        });
        return Object.entries(groups).map(([label, count]) => ({ label, count }));
      })
    );

    // RDV par mois (6 derniers mois)
    this.rdvMonthly$ = rdvs$.pipe(
      map(rdvs => {
        const months = this.getLast6Months();
        const counts = months.map(month => {
          return rdvs.filter(r => r.date?.startsWith(month)).length;
        });
        return counts;
      })
    );
  }

  private getLast6Months(): string[] {
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    return months;
  }

  async loadStats() {
    try {
      const patientsSnap = await getCountFromServer(collection(this.firestore, 'patients'));
      this.patientsCount.set(patientsSnap.data().count);

      const medecinsSnap = await getCountFromServer(collection(this.firestore, 'medecins'));
      this.medecinsCount.set(medecinsSnap.data().count);

      const rdvSnap = await getCountFromServer(collection(this.firestore, 'rendezvous'));
      this.rdvTodayCount.set(rdvSnap.data().count);

      const ordSnap = await getCountFromServer(collection(this.firestore, 'ordonnances'));
      this.ordonnancesCount.set(ordSnap.data().count);
    } catch (e) {
      console.error('Erreur chargement stats:', e);
    }
  }
}