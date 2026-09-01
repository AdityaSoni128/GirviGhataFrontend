import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  /**
   * Authentication initialization runs before initial router
   * navigation, so this signal represents the final startup state.
   */
  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

