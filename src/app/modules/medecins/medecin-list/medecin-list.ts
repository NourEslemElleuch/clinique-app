import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedecinService } from '../../../services/medecin';
import { SpecialiteService } from '../../../services/specialite';
import { MedecinForm } from '../medecin-form/medecin-form';
import { Medecin } from '../../../models/medecin.model';
import { Specialite } from '../../../models/specialite.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-medecin-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MedecinForm],
  templateUrl: './medecin-list.html',
  styleUrl: './medecin-list.css',
})
export class MedecinList implements OnInit, OnDestroy {
  medecins: Medecin[] = [];
  specialites: Specialite[] = [];
  recherche = '';
  loading = true;
  submitting = false;
  private subs: Subscription[] = [];

  constructor(
    private medecinService: MedecinService,
    private specialiteService: SpecialiteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subs.push(
      this.medecinService.getMedecins().subscribe({
        next: (data) => {
          this.medecins = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.markForCheck();
        }
      }),
      this.specialiteService.getSpecialites().subscribe(s => {
        this.specialites = s;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  async delete(id: string, nom: string) {
    if (!confirm(`Supprimer le médecin "${nom}" ?`)) return;
    this.submitting = true;
    try {
      await this.medecinService.deleteMedecin(id);
    } catch (e) {
      alert('Erreur suppression');
    } finally {
      this.submitting = false;
      this.cdr.markForCheck();
    }
  }

  getSpecialiteNom(id: string): string {
    return this.specialites.find(s => s.id === id)?.nom ?? 'Non assignée';
  }

  get filteredMedecins() {
    const term = this.recherche.toLowerCase();
    return this.medecins.filter(m =>
      m.nom.toLowerCase().includes(term) ||
      m.prenom.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      this.getSpecialiteNom(m.specialiteId).toLowerCase().includes(term)
    );
  }
}