import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/patient';
import { AuthService } from '../../../services/auth';
import { PatientForm } from '../patient-form/patient-form';
import { Patient } from '../../../models/patient.model';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Subscription, switchMap, from, of, map } from 'rxjs';
import { inject } from '@angular/core';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PatientForm],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientList implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  patients: Patient[] = [];
  allPatients: Patient[] = [];
  recherche = '';
  loading = true;
  submitting = false;
  userRole = '';
  private subs: Subscription[] = [];

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subs.push(
      user(this.auth).pipe(
        switchMap(u => {
          if (!u) return of({ role: '', uid: '' });
          return from(this.authService.getUserRole(u.uid)).pipe(
            map(role => ({ role, uid: u.uid }))
          );
        })
      ).subscribe(({ role, uid }) => {
        this.userRole = role;
        this.loadPatients(role, uid);
      })
    );
  }

  loadPatients(role: string, uid: string) {
    this.loading = true;

    // Charger tous les patients d'abord
    this.subs.push(
      this.patientService.getPatients().subscribe(allPats => {
        this.allPatients = allPats;

        if (role === 'admin') {
          // Admin voit tous les patients
          this.patients = allPats;
          this.loading = false;
          this.cdr.markForCheck();
        } else {
          // Médecin — récupérer ses RDV pour trouver ses patients
          const rdvRef = collection(this.firestore, 'rendezvous');
          const rdvQuery = query(rdvRef, where('medecinId', '==', uid));

          this.subs.push(
            (collectionData(rdvQuery, { idField: 'id' }) as any).subscribe((rdvs: any[]) => {
              // IDs uniques des patients de ce médecin
              const patientIds = [...new Set(rdvs.map((r: any) => r.patientId))];
              // Filtrer les patients
              this.patients = allPats.filter(p => patientIds.includes(p.id));
              this.loading = false;
              this.cdr.markForCheck();
            })
          );
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  async delete(id: string, nom: string) {
    if (!confirm(`Supprimer le patient "${nom}" ?`)) return;
    this.submitting = true;
    try {
      await this.patientService.deletePatient(id);
    } catch (e) {
      alert('Erreur suppression');
    } finally {
      this.submitting = false;
      this.cdr.markForCheck();
    }
  }

  get filteredPatients() {
    const term = this.recherche.toLowerCase();
    return this.patients.filter(p =>
      p.nom.toLowerCase().includes(term) ||
      p.prenom.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  }
}