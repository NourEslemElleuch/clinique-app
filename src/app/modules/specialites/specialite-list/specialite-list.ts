import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpecialiteService } from '../../../services/specialite';
import { SpecialiteForm } from '../specialite-form/specialite-form';
import { Specialite } from '../../../models/specialite.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-specialite-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SpecialiteForm],
  templateUrl: './specialite-list.html',
  styleUrl: './specialite-list.css',
})
export class SpecialiteList implements OnInit, OnDestroy {
  specialites: Specialite[] = [];
  recherche = '';
  loading = true;
  submitting = false;
  sortAsc = true;
  private sub?: Subscription;

  constructor(
    private specialiteService: SpecialiteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sub = this.specialiteService.getSpecialites().subscribe({
      next: (data) => {
        this.specialites = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur spécialités:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleSort() {
    this.sortAsc = !this.sortAsc;
    this.cdr.markForCheck();
  }

  async delete(id: string, nom: string) {
    if (!confirm(`Supprimer la spécialité "${nom}" ?`)) return;
    this.submitting = true;
    try {
      await this.specialiteService.deleteSpecialite(id);
    } catch (e) {
      alert('Erreur suppression');
    } finally {
      this.submitting = false;
      this.cdr.markForCheck();
    }
  }

  get filteredSpecialites() {
    const term = this.recherche.toLowerCase();
    return this.specialites
      .filter(s =>
        s.nom.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      )
      .sort((a, b) =>
        this.sortAsc
          ? a.nom.localeCompare(b.nom)
          : b.nom.localeCompare(a.nom)
      );
  }
}