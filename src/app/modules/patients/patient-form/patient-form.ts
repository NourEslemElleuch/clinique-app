import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../../services/patient';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="patientModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Modifier' : 'Ajouter' }} un patient</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Nom *</label>
                  <input type="text" class="form-control" formControlName="nom">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Prénom *</label>
                  <input type="text" class="form-control" formControlName="prenom">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" formControlName="email">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Téléphone *</label>
                  <input type="text" class="form-control" formControlName="telephone">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Date de naissance</label>
                  <input type="date" class="form-control" formControlName="dateNaissance">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Groupe sanguin</label>
                  <select class="form-select" formControlName="groupeSanguin">
                    <option value="">--</option>
                    <option *ngFor="let g of groupes" [value]="g">{{ g }}</option>
                  </select>
                </div>
                <div class="col-12 mb-3">
                  <label class="form-label">Adresse</label>
                  <input type="text" class="form-control" formControlName="adresse">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button type="button" class="btn btn-primary" (click)="save()" [disabled]="form.invalid || submitting" data-bs-dismiss="modal">
              <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ editingId ? 'Modifier' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PatientForm implements OnInit {
  form: FormGroup;
  editingId: string | null = null;
  submitting = false;
  groupes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor(private fb: FormBuilder, private patientService: PatientService) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      dateNaissance: [''],
      adresse: [''],
      groupeSanguin: ['']
    });
  }

  ngOnInit() {}

  async save() {
    if (this.form.invalid) return;
    this.submitting = true;
    try {
      const data = this.form.value as Patient;
      if (this.editingId) {
        await this.patientService.updatePatient(this.editingId, data);
      } else {
        await this.patientService.addPatient(data);
      }
      this.form.reset();
      this.editingId = null;
    } catch (e) {
      alert('Erreur sauvegarde');
    } finally {
      this.submitting = false;
    }
  }
}