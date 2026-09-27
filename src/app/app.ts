import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { AuthService } from './services/auth';
import { Observable, of, switchMap, shareReplay, filter } from 'rxjs';
import { from } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, AsyncPipe],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  private auth = inject(Auth);

  isAdmin$: Observable<boolean> = of(false);
  isMedecin$: Observable<boolean> = of(false);
  userRole$: Observable<string> = of('');

  // Cacher navbar sur login/register
  showNavbar = true;
  private hiddenRoutes = ['/login', '/register'];

  constructor(public authService: AuthService, private router: Router) {
    // Écouter les changements de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showNavbar = !this.hiddenRoutes.includes(event.urlAfterRedirects);
    });
  }

  ngOnInit() {
    this.userRole$ = user(this.auth).pipe(
      switchMap(u => {
        if (!u) return of('');
        return from(this.authService.getUserRole(u.uid));
      }),
      shareReplay(1)
    );

    this.isAdmin$ = this.userRole$.pipe(
      switchMap(role => of(role === 'admin'))
    );

    this.isMedecin$ = this.userRole$.pipe(
      switchMap(role => of(role === 'medecin'))
    );
  }

  getUserInitial(email: string | null | undefined): string {
    if (!email) return '?';
    return email.split('@')[0].charAt(0).toUpperCase();
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch(() => {
      this.router.navigate(['/login']);
    });
  }
}