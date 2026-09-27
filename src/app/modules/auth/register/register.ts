import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  form: FormGroup;
  erreur = '';
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['admin', Validators.required]
    });
  }

  async inscription() {
    if (this.form.invalid) return;
    this.submitting = true;
    this.erreur = '';
    try {
      await this.authService.register(
        this.form.value.email,
        this.form.value.password,
        this.form.value.role
      );
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.erreur = e.message || "Erreur lors de l'inscription";
    } finally {
      this.submitting = false;
    }
  }
}