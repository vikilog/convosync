/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useSyncExternalStore } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { readLoggedIn, subscribeAuth } from '../lib/session';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthed = useSyncExternalStore(subscribeAuth, readLoggedIn, () => false);

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
