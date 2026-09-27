import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {

  form: FormGroup;
  erreur = '';
  submitting = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async connexion() {
    if (this.form.invalid) return;
    this.submitting = true;
    this.erreur = '';
    try {
      await this.authService.login(this.form.value.email, this.form.value.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.erreur = e.message || 'Email ou mot de passe incorrect';
    } finally {
      this.submitting = false;
    }
  }
}