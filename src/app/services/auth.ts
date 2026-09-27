import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  user$: Observable<any>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.user$ = user(this.auth);
  }

  // Connexion
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Inscription + sauvegarde du rôle
  register(email: string, password: string, role: string = 'user') {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(result => {
        return setDoc(doc(this.firestore, 'users', result.user.uid), {
          email,
          role,
          uid: result.user.uid
        });
      });
  }

  // Déconnexion
  logout() {
    return signOut(this.auth);
  }

  // Récupérer le rôle
  async getUserRole(uid: string): Promise<string> {
    const docSnap = await getDoc(doc(this.firestore, 'users', uid));
    if (docSnap.exists()) return docSnap.data()['role'];
    return 'user';
  }
}