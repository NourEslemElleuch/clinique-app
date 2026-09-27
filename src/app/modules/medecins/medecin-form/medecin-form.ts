import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedecinService } from '../../../services/medecin';
import { SpecialiteService } from '../../../services/specialite';
import { Medecin } from '../../../models/medecin.model';
import { Specialite } from '../../../models/specialite.model';

@Component({
  selector: 'app-medecin-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="medecinModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Modifier' : 'Ajouter' }} un médecin</h5>
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
                <div class="col-12 mb-3">
                  <label class="form-label">Spécialité *</label>
                  <select class="form-select" formControlName="specialiteId">
                    <option value="">-- Sélectionner --</option>
                    <option *ngFor="let s of specialites" [value]="s.id">{{ s.nom }}</option>
                  </select>
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
export class MedecinForm implements OnInit {
  form: FormGroup;
  editingId: string | null = null;
  submitting = false;
  specialites: Specialite[] = [];

  constructor(
    private fb: FormBuilder,
    private medecinService: MedecinService,
    private specialiteService: SpecialiteService
  ) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      specialiteId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.specialiteService.getSpecialites().subscribe(s => this.specialites = s);
  }

  async save() {
    if (this.form.invalid) return;
    this.submitting = true;
    try {
      const data = this.form.value as Medecin;
      if (this.editingId) {
        await this.medecinService.updateMedecin(this.editingId, data);
      } else {
        await this.medecinService.addMedecin(data);
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