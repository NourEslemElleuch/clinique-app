import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { medecinGuard } from './guards/medecin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Public
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./modules/auth/register/register').then(m => m.Register)
  },

  // Protégées — tous les connectés
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/dashboard/dashboard/dashboard').then(m => m.Dashboard)
  },

  // Admin + Médecin
  {
    path: 'patients',
    canActivate: [authGuard, medecinGuard],
    loadComponent: () => import('./modules/patients/patient-list/patient-list').then(m => m.PatientList)
  },
  {
    path: 'rendezvous',
    canActivate: [authGuard, medecinGuard],
    loadComponent: () => import('./modules/rendezvous/rdv-list/rdv-list').then(m => m.RdvList)
  },
  {
    path: 'ordonnances',
    canActivate: [authGuard, medecinGuard],
    loadComponent: () => import('./modules/ordonnances/ordonnance-list/ordonnance-list').then(m => m.OrdonnanceList)
  },

  // Admin seulement
  {
    path: 'medecins',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./modules/medecins/medecin-list/medecin-list').then(m => m.MedecinList)
  },
  {
    path: 'specialites',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./modules/specialites/specialite-list/specialite-list').then(m => m.SpecialiteList)
  },

  { path: '**', redirectTo: 'login' }
];