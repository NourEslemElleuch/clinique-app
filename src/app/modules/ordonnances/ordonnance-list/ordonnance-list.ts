import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrdonnanceService } from '../../../services/ordonnance';
import { PatientService } from '../../../services/patient';
import { MedecinService } from '../../../services/medecin';
import { AuthService } from '../../../services/auth';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Ordonnance } from '../../../models/ordonnance.model';
import { Patient } from '../../../models/patient.model';
import { Medecin } from '../../../models/medecin.model';
import { Subscription, switchMap, from, of, map, combineLatest } from 'rxjs';
import { inject } from '@angular/core';

@Component({
  selector: 'app-ordonnance-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ordonnance-list.html',
  styleUrl: './ordonnance-list.css',
})
export class OrdonnanceList implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  ordonnances: Ordonnance[] = [];
  patients: Patient[] = [];
  medecins: Medecin[] = [];
  recherche = '';
  loading = true;
  submitting = false;
  editingId: string | null = null;
  userRole = '';
  private subs: Subscription[] = [];

  form: FormGroup;

  constructor(
    private ordonnanceService: OrdonnanceService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      medecinId: ['', Validators.required],
      rendezVousId: [''],
      date: ['', Validators.required],
      medicaments: ['', Validators.required],
      instructions: ['']
    });
  }

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
        this.loadData(role, uid);
      })
    );
  }

  loadData(role: string, uid: string) {
    this.loading = true;

    this.subs.push(
      this.patientService.getPatients().subscribe(p => {
        this.patients = p;
        this.cdr.markForCheck();
      }),
      this.medecinService.getMedecins().subscribe(m => {
        this.medecins = m;
        this.cdr.markForCheck();
      })
    );

    if (role === 'admin') {
      // Admin voit toutes les ordonnances
      this.subs.push(
        this.ordonnanceService.getOrdonnancesAvecDetails().subscribe({
          next: (data) => {
            this.ordonnances = data;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => { this.loading = false; this.cdr.markForCheck(); }
        })
      );
    } else {
      // Médecin — d'abord trouver ses patients via ses RDV
      const rdvRef = collection(this.firestore, 'rendezvous');
      const rdvQuery = query(rdvRef, where('medecinId', '==', uid));

      this.subs.push(
        (collectionData(rdvQuery, { idField: 'id' }) as any).pipe(
          switchMap((rdvs: any[]) => {
            // IDs uniques des patients de ce médecin
            const patientIds = [...new Set(rdvs.map((r: any) => r.patientId))];

            if (patientIds.length === 0) return of([]);

            // Toutes les ordonnances + filtrer par patientIds
            return this.ordonnanceService.getOrdonnancesAvecDetails().pipe(
              map(ords => ords.filter(o => patientIds.includes(o.patientId)))
            );
          })
        ).subscribe({
          next: (data: Ordonnance[]) => {
            this.ordonnances = data;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => { this.loading = false; this.cdr.markForCheck(); }
        })
      );
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  openModal(ord?: Ordonnance) {
    this.editingId = ord?.id ?? null;
    this.form.reset();
    if (ord) this.form.patchValue(ord);
    this.cdr.markForCheck();
  }

  async save() {
    if (this.form.invalid) return;
    this.submitting = true;
    try {
      const data = this.form.value as Ordonnance;
      if (this.editingId) {
        await this.ordonnanceService.updateOrdonnance(this.editingId, data);
      } else {
        await this.ordonnanceService.addOrdonnance(data);
      }
      this.editingId = null;
      this.form.reset();
    } catch (e) {
      alert('Erreur sauvegarde');
    } finally {
      this.submitting = false;
      this.cdr.markForCheck();
    }
  }

  async delete(id: string) {
    if (!confirm('Supprimer cette ordonnance ?')) return;
    await this.ordonnanceService.deleteOrdonnance(id);
  }

  get filteredOrdonnances() {
    const term = this.recherche.toLowerCase();
    return this.ordonnances.filter(o =>
      (o.patientNom ?? '').toLowerCase().includes(term) ||
      (o.medecinNom ?? '').toLowerCase().includes(term) ||
      o.medicaments.toLowerCase().includes(term)
    );
  }
}