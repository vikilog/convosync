/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type KeepAliveProps = {
  active: boolean;
  children: ReactNode;
};

const KeepAliveActiveContext = createContext(false);
const KeepAliveActivationContext = createContext(0);

/** Whether this KeepAlive panel is the visible tab. */
export function useKeepAliveActive() {
  return useContext(KeepAliveActiveContext);
}

/**
 * Runs when the user returns to a kept-alive tab (inactive → active).
 * Skips the first mount so initial load stays in each view's own effect.
 */
export function useKeepAliveActivation(onReactivate: () => void | Promise<void>) {
  const activation = useContext(KeepAliveActivationContext);
  const isActive = useContext(KeepAliveActiveContext);
  const onReactivateRef = useRef(onReactivate);
  onReactivateRef.current = onReactivate;
  const lastActivationRef = useRef(0);

  useEffect(() => {
    if (!isActive || activation === 0 || activation === lastActivationRef.current) return;
    lastActivationRef.current = activation;
    void onReactivateRef.current();
  }, [activation, isActive]);
}

/** Keeps children mounted but hidden when inactive so tab state is preserved. */
export function KeepAlive({ active, children }: KeepAliveProps) {
  const prevActiveRef = useRef(active);
  const [activation, setActivation] = useState(0);

  useEffect(() => {
    if (active && !prevActiveRef.current) {
      setActivation((count) => count + 1);
    }
    prevActiveRef.current = active;
  }, [active]);

  return (
    <KeepAliveActiveContext.Provider value={active}>
      <KeepAliveActivationContext.Provider value={activation}>
        <div className={active ? 'h-full min-h-0' : 'hidden'} aria-hidden={!active}>
          {children}
        </div>
      </KeepAliveActivationContext.Provider>
    </KeepAliveActiveContext.Provider>
  );
}
