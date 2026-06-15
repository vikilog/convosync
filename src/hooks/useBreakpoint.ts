import { useEffect, useState } from 'react';

export const MD_BREAKPOINT = '(min-width: 768px)';
export const LG_BREAKPOINT = '(min-width: 1024px)';
export const XL_BREAKPOINT = '(min-width: 1280px)';

function getInitialMatch(query: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getInitialMatch(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useIsMediumUp() {
  return useMediaQuery(MD_BREAKPOINT);
}

export function useIsLargeUp() {
  return useMediaQuery(LG_BREAKPOINT);
}

export function useIsXLargeUp() {
  return useMediaQuery(XL_BREAKPOINT);
}
