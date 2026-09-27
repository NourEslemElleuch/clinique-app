import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { AuthService } from '../services/auth';
import { switchMap, map, take } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    switchMap(u => {
      if (!u) {
        router.navigate(['/login']);
        return of(false);
      }
      return from(authService.getUserRole(u.uid)).pipe(
        map(role => {
          if (role === 'admin') return true;
          // Si pas admin, laisser passer quand même pour le dev
          
          return true;
        })
      );
    })
  );
};