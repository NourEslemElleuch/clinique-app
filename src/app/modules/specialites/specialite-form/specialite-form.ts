import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpecialiteService } from '../../../services/specialite';
import { Specialite } from '../../../models/specialite.model';

@Component({
  selector: 'app-specialite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="specialiteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Modifier' : 'Ajouter' }} une spécialité</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form">
              <div class="mb-3">
                <label class="form-label">Nom *</label>
                <input type="text" class="form-control" formControlName="nom" placeholder="Ex: Cardiologie">
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" formControlName="description" rows="3"
                          placeholder="Description de la spécialité..."></textarea>
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
export class SpecialiteForm {
  form: FormGroup;
  editingId: string | null = null;
  submitting = false;

  constructor(private fb: FormBuilder, private specialiteService: SpecialiteService) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      description: ['']
    });
  }

  async save() {
    if (this.form.invalid) return;
    this.submitting = true;
    try {
      const data = this.form.value as Specialite;
      if (this.editingId) {
        await this.specialiteService.updateSpecialite(this.editingId, data);
      } else {
        await this.specialiteService.addSpecialite(data);
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