import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../services/dashboard';
import { Auth, user } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { RendezVous } from '../../../models/rendezvous.model';
import { Observable, Subscription, of, switchMap, combineLatest, map } from 'rxjs';
import { from } from 'rxjs';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  dashboardService = inject(DashboardService);
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  // Rôle
  userRole = '';
  userName = '';

  // Stats médecin
  medecinRdvTotal = 0;
  medecinRdvAujourdhui = 0;
  medecinPatientsUniques = 0;
  medecinRdvList: RendezVous[] = [];

  // Charts refs
  @ViewChild('rdvMonthlyChart') rdvMonthlyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('groupeSanguinChart') groupeSanguinCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('specialiteChart') specialiteCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rdvStatutChart') rdvStatutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('medecinStatutChart') medecinStatutCanvas!: ElementRef<HTMLCanvasElement>;

  private chartInstances: { [key: string]: Chart } = {};
  private subs: Subscription[] = [];

  readonly TEAL_PALETTE = ['#1a6b7a','#2a9db5','#3dbdd6','#5ccfe0','#7dd8e8','#9ee3ef'];
  readonly STATUT_COLORS: Record<string, { bg: string; border: string }> = {
    'planifié': { bg: 'rgba(255,193,7,0.85)',  border: '#ffc107' },
    'terminé':  { bg: 'rgba(40,167,69,0.85)',  border: '#28a745' },
    'annulé':   { bg: 'rgba(220,53,69,0.85)',  border: '#dc3545' }
  };

  ngOnInit() {
    this.subs.push(
      user(this.auth).pipe(
        switchMap(u => {
          if (!u) return of({ role: '', email: '' });
          return from(this.authService.getUserRole(u.uid)).pipe(
            map(role => ({ role, email: u.email ?? '', uid: u.uid }))
          );
        })
      ).subscribe(({ role, email, uid }: any) => {
        this.userRole = role;
        this.userName = email?.split('@')[0] ?? '';

        if (role === 'admin') {
          this.dashboardService.loadStats();
        } else if (role === 'medecin' && uid) {
          this.loadMedecinStats(uid);
        }
      })
    );
  }

  private loadMedecinStats(uid: string) {
    // RDV de ce médecin
    const rdvRef = collection(this.firestore, 'rendezvous');
    const rdvQuery = query(rdvRef, where('medecinId', '==', uid));

    this.subs.push(
      (collectionData(rdvQuery, { idField: 'id' }) as Observable<RendezVous[]>).subscribe(rdvs => {
        this.medecinRdvTotal = rdvs.length;

        // RDV aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        this.medecinRdvAujourdhui = rdvs.filter(r => r.date === today).length;

        // Patients uniques
        const uniquePatients = new Set(rdvs.map(r => r.patientId));
        this.medecinPatientsUniques = uniquePatients.size;

        // Liste RDV aujourd'hui + planifiés
        this.medecinRdvList = rdvs
          .filter(r => r.statut === 'planifié')
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);

        // Chart statut
        setTimeout(() => this.initMedecinStatutChart(rdvs), 100);
      })
    );
  }

  private initMedecinStatutChart(rdvs: RendezVous[]) {
    if (!this.medecinStatutCanvas?.nativeElement) return;
    if (this.chartInstances['medecinStatut']) {
      this.chartInstances['medecinStatut'].destroy();
    }

    const counts = { 'planifié': 0, 'terminé': 0, 'annulé': 0 };
    rdvs.forEach(r => { if (r.statut in counts) counts[r.statut as keyof typeof counts]++; });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const bgColors = labels.map(l => this.STATUT_COLORS[l]?.bg ?? '#ccc');
    const borders = labels.map(l => this.STATUT_COLORS[l]?.border ?? '#ccc');

    this.chartInstances['medecinStatut'] = new Chart(this.medecinStatutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: bgColors, borderColor: borders, borderWidth: 2 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.userRole === 'admin') {
        this.initAdminCharts();
      }
    }, 200);
  }

  private initAdminCharts() {
    // RDV mensuels - dynamique
    this.subs.push(
      this.dashboardService.rdvMonthly$.subscribe(data => {
        const labels = this.getMonthLabels();
        this.updateLineChart('line', this.rdvMonthlyCanvas, labels, data);
      })
    );

    // Patients par groupe sanguin
    this.subs.push(
      this.dashboardService.patientsByGroupeSanguin$.subscribe(data => {
        this.updateDonutOrPie('groupeSanguin', this.groupeSanguinCanvas, 'doughnut', data);
      })
    );

    // RDV par statut
    this.subs.push(
      this.dashboardService.rdvByStatut$.subscribe(data => {
        const bgColors = data.map(d => this.STATUT_COLORS[d.label]?.bg ?? 'rgba(150,150,150,0.8)');
        const borders  = data.map(d => this.STATUT_COLORS[d.label]?.border ?? '#999');
        this.updateDonutOrPie('rdvStatut', this.rdvStatutCanvas, 'pie', data, bgColors, borders);
      })
    );

    // Médecins par spécialité
    this.subs.push(
      this.dashboardService.medecinsBySpecialite$.subscribe(data => {
        this.updateBarChart('specialite', this.specialiteCanvas, data);
      })
    );
  }

  private updateDonutOrPie(
    key: string, canvasRef: ElementRef<HTMLCanvasElement>, type: 'doughnut'|'pie',
    data: { label: string; count: number }[], bgColors?: string[], borderColors?: string[]
  ) {
    if (!canvasRef?.nativeElement) return;
    const bg = bgColors ?? this.TEAL_PALETTE;
    const bd = borderColors ?? bg;

    if (this.chartInstances[key]) {
      this.chartInstances[key].data.labels = data.map(d => d.label);
      this.chartInstances[key].data.datasets[0].data = data.map(d => d.count);
      (this.chartInstances[key].data.datasets[0] as any).backgroundColor = bg;
      this.chartInstances[key].update('none');
      return;
    }

    this.chartInstances[key] = new Chart(canvasRef.nativeElement, {
      type,
      data: {
        labels: data.map(d => d.label),
        datasets: [{ data: data.map(d => d.count), backgroundColor: bg, borderColor: bd, borderWidth: 2 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } }
      }
    });
  }

  private updateBarChart(key: string, canvasRef: ElementRef<HTMLCanvasElement>, data: { label: string; count: number }[]) {
    if (!canvasRef?.nativeElement) return;

    if (this.chartInstances[key]) {
      this.chartInstances[key].data.labels = data.map(d => d.label);
      this.chartInstances[key].data.datasets[0].data = data.map(d => d.count);
      this.chartInstances[key].update('none');
      return;
    }

    this.chartInstances[key] = new Chart(canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Médecins',
          data: data.map(d => d.count),
          backgroundColor: this.TEAL_PALETTE,
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private getMonthLabels(): string[] {
    const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const labels: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(months[date.getMonth()]);
    }
    return labels;
  }

  private updateLineChart(
    key: string, canvasRef: ElementRef<HTMLCanvasElement>, labels: string[], data: number[]
  ) {
    if (!canvasRef?.nativeElement) return;

    if (this.chartInstances[key]) {
      this.chartInstances[key].data.labels = labels;
      this.chartInstances[key].data.datasets[0].data = data;
      this.chartInstances[key].update('none');
      return;
    }

    this.chartInstances[key] = new Chart(canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Rendez-vous',
          data,
          backgroundColor: 'rgba(42,157,181,0.15)',
          borderColor: '#2a9db5',
          borderWidth: 2.5,
          pointBackgroundColor: '#1a6b7a',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  ngOnDestroy() {
    Object.values(this.chartInstances).forEach(c => c.destroy());
    this.subs.forEach(s => s.unsubscribe());
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'planifié': 'bg-warning',
      'terminé': 'bg-success',
      'annulé': 'bg-danger'
    };
    return map[statut] ?? 'bg-secondary';
  }
}