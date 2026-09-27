import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RendezVousService } from '../../../services/rendezvous';
import { PatientService } from '../../../services/patient';
import { MedecinService } from '../../../services/medecin';
import { AuthService } from '../../../services/auth';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { RendezVous } from '../../../models/rendezvous.model';
import { Patient } from '../../../models/patient.model';
import { Medecin } from '../../../models/medecin.model';
import { Subscription, switchMap, from, of, combineLatest, map } from 'rxjs';
import { inject } from '@angular/core';

@Component({
  selector: 'app-rdv-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './rdv-list.html',
  styleUrl: './rdv-list.css',
})
export class RdvList implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  rdvs: RendezVous[] = [];
  allPatients: Patient[] = [];
  medecins: Medecin[] = [];
  recherche = '';
  loading = true;
  submitting = false;
  editingId: string | null = null;
  userRole = '';
  currentUserUid = '';  // UID du médecin connecté
  private subs: Subscription[] = [];

  form: FormGroup;

  constructor(
    private rdvService: RendezVousService,
    private patientService: PatientService,
    private medecinService: MedecinService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      medecinId: ['', Validators.required],
      date: ['', Validators.required],
      heure: ['', Validators.required],
      motif: ['', Validators.required],
      statut: ['planifié', Validators.required]
    });
  }

  ngOnInit() {
    // Charger TOUS les patients et médecins pour le formulaire
    this.subs.push(
      this.patientService.getPatients().subscribe(p => {
        this.allPatients = p;
        this.cdr.markForCheck();
      }),
      this.medecinService.getMedecins().subscribe(m => {
        this.medecins = m;
        this.cdr.markForCheck();
      })
    );

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
        this.currentUserUid = uid;
        this.loadRdvs(role, uid);
      })
    );
  }

  loadRdvs(role: string, uid: string) {
    this.loading = true;

    if (role === 'admin') {
      this.subs.push(
        this.rdvService.getRendezVousAvecDetails().subscribe({
          next: (data) => {
            this.rdvs = data;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => { this.loading = false; this.cdr.markForCheck(); }
        })
      );
    } else {
      const rdvRef = collection(this.firestore, 'rendezvous');
      const rdvQuery = query(rdvRef, where('medecinId', '==', uid));

      this.subs.push(
        (collectionData(rdvQuery, { idField: 'id' }) as any).pipe(
          switchMap((rdvs: RendezVous[]) =>
            combineLatest([
              this.patientService.getPatients(),
              this.medecinService.getMedecins()
            ]).pipe(
              map(([patients, medecins]) =>
                rdvs.map(rdv => ({
                  ...rdv,
                  patientNom: (patients.find(p => p.id === rdv.patientId)?.nom ?? '') + ' ' +
                              (patients.find(p => p.id === rdv.patientId)?.prenom ?? ''),
                  medecinNom: 'Dr. ' + (medecins.find(m => m.id === rdv.medecinId)?.nom ?? '')
                }))
              )
            )
          )
        ).subscribe({
          next: (data: RendezVous[]) => {
            this.rdvs = data;
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

  openModal(rdv?: RendezVous) {
    this.editingId = rdv?.id ?? null;
    this.form.reset({ statut: 'planifié' });

    if (rdv) {
      this.form.patchValue(rdv);
    } else if (this.userRole === 'medecin') {
      // ✅ Pré-remplir automatiquement le médecin connecté
      this.form.patchValue({ medecinId: this.currentUserUid });
    }

    // ✅ Désactiver le champ médecin pour le rôle médecin
    if (this.userRole === 'medecin') {
      this.form.get('medecinId')?.disable();
    } else {
      this.form.get('medecinId')?.enable();
    }

    this.cdr.markForCheck();
  }

  async save() {
    if (this.form.invalid) return;
    this.submitting = true;
    try {
      // getRawValue() pour inclure les champs disabled
      const data = this.form.getRawValue() as RendezVous;
      if (this.editingId) {
        await this.rdvService.updateRendezVous(this.editingId, data);
      } else {
        await this.rdvService.addRendezVous(data);
      }
      this.editingId = null;
      this.form.reset({ statut: 'planifié' });
    } catch (e) {
      alert('Erreur sauvegarde');
    } finally {
      this.submitting = false;
      this.cdr.markForCheck();
    }
  }

  async delete(id: string) {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    await this.rdvService.deleteRendezVous(id);
  }

  getMedecinNomByUid(uid: string): string {
    const m = this.medecins.find(m => m.id === uid);
    return m ? `${m.nom} ${m.prenom}` : '';
  }

  get filteredRdvs() {
    const term = this.recherche.toLowerCase();
    return this.rdvs.filter(r =>
      (r.patientNom ?? '').toLowerCase().includes(term) ||
      (r.medecinNom ?? '').toLowerCase().includes(term) ||
      r.motif.toLowerCase().includes(term)
    );
  }
}