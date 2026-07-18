/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { readLoggedIn, subscribeAuth } from '../lib/session';

/** Avoid re-hitting /auth/me on every nested ProtectedRoute remount for the same token. */
let validatedToken: string | null = null;
let validateInFlight: Promise<boolean> | null = null;

function ensureSessionValid(): Promise<boolean> {
  const token = localStorage.getItem('convosync_token');
  if (!token) {
    validatedToken = null;
    return Promise.resolve(false);
  }
  if (validatedToken === token) return Promise.resolve(true);
  if (validateInFlight) return validateInFlight;

  validateInFlight = api
    .getMe()
    .then(() => {
      validatedToken = token;
      return true;
    })
    .catch(() => {
      // 401 already runs forceLogoutToLogin via assertOk
      validatedToken = null;
      return false;
    })
    .finally(() => {
      validateInFlight = null;
    });

  return validateInFlight;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthed = useSyncExternalStore(subscribeAuth, readLoggedIn, () => false);
  const [sessionOk, setSessionOk] = useState<boolean | null>(() =>
    isAuthed && validatedToken === localStorage.getItem('convosync_token') ? true : null
  );

  useEffect(() => {
    if (!isAuthed) {
      validatedToken = null;
      setSessionOk(false);
      return;
    }

    let cancelled = false;
    if (validatedToken === localStorage.getItem('convosync_token')) {
      setSessionOk(true);
      return;
    }

    setSessionOk(null);
    void ensureSessionValid().then((ok) => {
      if (!cancelled) setSessionOk(ok);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  if (!isAuthed || sessionOk === false) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (sessionOk === null) {
    return null;
  }

  return <>{children}</>;
}
