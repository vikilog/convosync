/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPageSeo, seoForPath } from '../lib/seo';

/** Updates document title and HTML meta tags when the route changes. */
export function DocumentSeo() {
  const { pathname } = useLocation();

  const seo = useMemo(() => seoForPath(pathname), [pathname]);

  useEffect(() => {
    applyPageSeo(seo);
  }, [seo]);

  return null;
}
