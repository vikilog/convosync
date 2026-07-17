/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Blocks } from 'lucide-react';
import { pathForTab } from '../routes';
import { api } from '../lib/api';
import {
  BusinessApiOnboardingPage,
  CoexistenceOnboardingPage,
  WhatsappConnectionSelector,
  type WhatsAppConnectionType,
} from './whatsapp';
import WhatsAppEmbeddedSignup from './WhatsAppEmbeddedSignup';
import {
  WhatsAppAccountManager,
  type WhatsAppPhoneAccount,
} from './integrations/WhatsAppAccountManager';

const CONNECTION_TYPE_STORAGE_KEY = 'convosync_whatsapp_connection_type';
const BUSINESS_API_ONBOARDING_STEP_KEY = 'convosync_business_api_onboarding_step';
const COEXISTENCE_ONBOARDING_STEP_KEY = 'convosync_coexistence_onboarding_step';
const PENDING_SETUP_SESSION_KEY = 'convosync_whatsapp_pending_setup';

type NumbersFlowView =
  | 'selector'
  | 'business_api_guide'
  | 'business_api_connect'
  | 'coexistence_guide'
  | 'coexistence_connect'
  | 'accounts';

function loadStoredConnectionType(): WhatsAppConnectionType | null {
  const raw = localStorage.getItem(CONNECTION_TYPE_STORAGE_KEY);
  if (raw === 'business_api' || raw === 'app_coexistence') return raw;
  return null;
}

function resolveNumbersFlowFromStorage(): NumbersFlowView {
  const stored = loadStoredConnectionType();
  if (!stored) return 'selector';
  if (stored === 'business_api') {
    const step = localStorage.getItem(BUSINESS_API_ONBOARDING_STEP_KEY);
    return step && Number(step) >= 2 ? 'business_api_connect' : 'business_api_guide';
  }
  const coexistenceStep = localStorage.getItem(COEXISTENCE_ONBOARDING_STEP_KEY);
  return coexistenceStep && Number(coexistenceStep) >= 2
    ? 'coexistence_connect'
    : 'coexistence_guide';
}

type ManagerViewProps = {
  isActive?: boolean;
  /** When embedded under Integrations → WhatsApp, shows selector inline and back to hub. */
  variant?: 'standalone' | 'integrations';
  onBackToHub?: () => void;
  onAccountsChanged?: () => void;
};

export const ManagerView: React.FC<ManagerViewProps> = ({
  isActive = true,
  variant = 'standalone',
  onBackToHub,
  onAccountsChanged,
}) => {
  const navigate = useNavigate();

  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppPhoneAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [connectError, setConnectError] = useState('');
  const hasWhatsappNumbers = whatsappAccounts.length > 0;

  const loadWhatsappAccounts = (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setAccountsLoading(true);
    }
    return api
      .getWhatsAppAccounts()
      .then(
        (data: {
          accounts: Array<{
            id: string;
            phoneNumberId: string;
            phoneNumber?: string;
            displayName?: string;
            label?: string;
          }>;
        }) => {
          const mapped = (data.accounts || []).map((a) => ({
            id: a.id,
            phoneNumberId: a.phoneNumberId,
            label: a.label || a.displayName || 'WhatsApp Business Account',
            phone: a.phoneNumber || a.phoneNumberId,
            dailyLimit: 'Meta managed',
            qosRating: 'Synced',
            status: 'Connected',
            verified: true,
          }));
          setWhatsappAccounts(mapped);
          if (mapped.length === 0) {
            setNumbersFlow((flow) =>
              flow === 'business_api_guide' || flow === 'coexistence_guide' ? 'selector' : flow
            );
          }
          return mapped;
        }
      )
      .catch((err) => {
        console.error(err);
        return [];
      })
      .finally(() => {
        if (!options?.silent) {
          setAccountsLoading(false);
        }
      });
  };

  const [connectionType, setConnectionType] = useState<WhatsAppConnectionType | null>(
    loadStoredConnectionType
  );
  const [numbersFlow, setNumbersFlow] = useState<NumbersFlowView>(resolveNumbersFlowFromStorage);
  const [isStartingApiSetup, setIsStartingApiSetup] = useState(false);
  const [isStartingCoexistenceSetup, setIsStartingCoexistenceSetup] = useState(false);
  const [autoLaunchSignup, setAutoLaunchSignup] = useState(false);
  const accountsLoadedRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;
    if (!localStorage.getItem('convosync_token')) {
      setAccountsLoading(false);
      return;
    }
    loadWhatsappAccounts({ silent: accountsLoadedRef.current });
    accountsLoadedRef.current = true;
  }, [isActive]);

  /** KeepAlive keeps this view mounted — re-read Integrations → Manager handoff from storage. */
  useEffect(() => {
    if (!isActive || accountsLoading || hasWhatsappNumbers) return;

    const storedType = loadStoredConnectionType();
    const pendingSetup = sessionStorage.getItem(PENDING_SETUP_SESSION_KEY) === '1';
    if (!storedType && !pendingSetup) return;

    if (storedType) {
      setConnectionType(storedType);
    }
    const flow = resolveNumbersFlowFromStorage();
    setNumbersFlow(flow);

    const stepKey =
      storedType === 'app_coexistence'
        ? COEXISTENCE_ONBOARDING_STEP_KEY
        : BUSINESS_API_ONBOARDING_STEP_KEY;
    const atConnectStep =
      storedType &&
      Number(localStorage.getItem(stepKey)) >= 2 &&
      (flow === 'business_api_connect' || flow === 'coexistence_connect');

    if (atConnectStep || pendingSetup) {
      setAutoLaunchSignup(true);
      sessionStorage.removeItem(PENDING_SETUP_SESSION_KEY);
    }
  }, [isActive, accountsLoading, hasWhatsappNumbers]);

  const clearWhatsappQueryFlag = (key: string) => {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    if (variant === 'integrations') {
      params.set('channel', 'whatsapp');
    }
    const qs = params.toString();
    window.history.replaceState(
      {},
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('whatsapp_connected') === '1') {
      sessionStorage.removeItem('convosync_onboarding');
      loadWhatsappAccounts({ silent: true }).then((accounts) => {
        if (accounts.length > 0) {
          onAccountsChanged?.();
        }
      });
      clearWhatsappQueryFlag('whatsapp_connected');
    }
    if (params.get('whatsapp_error') === '1') {
      setConnectError('WhatsApp connection failed. Please try again.');
      clearWhatsappQueryFlag('whatsapp_error');
    }
  }, []);

  const handleChangeConnectionMethod = () => {
    setConnectionType(null);
    localStorage.removeItem(CONNECTION_TYPE_STORAGE_KEY);
    localStorage.removeItem(BUSINESS_API_ONBOARDING_STEP_KEY);
    localStorage.removeItem(COEXISTENCE_ONBOARDING_STEP_KEY);
    setNumbersFlow('selector');
    if (variant === 'integrations') {
      return;
    }
    navigate(pathForTab('integrations'));
  };

  const handleGetStartedFromSelector = (type: WhatsAppConnectionType) => {
    if (type === 'app_coexistence') return;
    setConnectionType(type);
    localStorage.setItem(CONNECTION_TYPE_STORAGE_KEY, type);
    if (type === 'business_api') {
      localStorage.setItem(BUSINESS_API_ONBOARDING_STEP_KEY, '2');
      setNumbersFlow('business_api_connect');
    } else {
      localStorage.setItem(COEXISTENCE_ONBOARDING_STEP_KEY, '2');
      setNumbersFlow('coexistence_connect');
    }
    sessionStorage.setItem(PENDING_SETUP_SESSION_KEY, '1');
    setAutoLaunchSignup(true);
  };

  const handleStartBusinessApiOnboarding = () => {
    setIsStartingApiSetup(true);
    localStorage.setItem(BUSINESS_API_ONBOARDING_STEP_KEY, '2');
    setTimeout(() => {
      setIsStartingApiSetup(false);
      setNumbersFlow('business_api_connect');
    }, 400);
  };

  const handleStartCoexistenceOnboarding = () => {
    setIsStartingCoexistenceSetup(true);
    localStorage.setItem(COEXISTENCE_ONBOARDING_STEP_KEY, '2');
    setTimeout(() => {
      setIsStartingCoexistenceSetup(false);
      setNumbersFlow('coexistence_connect');
    }, 400);
  };

  const handleConnectSuccess = async (data?: {
    webhookSubscribe?: { error?: string; wabaSubscribed?: boolean; details?: string };
    coexistenceSync?: {
      contactsRequestId?: string;
      historyRequestId?: string;
      error?: string;
      details?: string;
    };
    connectionMode?: WhatsAppConnectionType;
  }) => {
    setConnectError('');
    setAutoLaunchSignup(false);
    sessionStorage.removeItem(PENDING_SETUP_SESSION_KEY);
    localStorage.removeItem(BUSINESS_API_ONBOARDING_STEP_KEY);
    localStorage.removeItem(COEXISTENCE_ONBOARDING_STEP_KEY);
    const accounts = await loadWhatsappAccounts({ silent: true });
    if (accounts.length > 0) {
      onAccountsChanged?.();
    }

    const sub = data?.webhookSubscribe;
    if (sub && (!sub.wabaSubscribed || sub.error)) {
      const msg = [sub.error, sub.details].filter(Boolean).join(' — ');
      setConnectError(
        msg
          ? `Number connected, but webhook auto-subscribe needs attention: ${msg}`
          : 'Number connected. Open Webhooks tab and click Subscribe via API if inbound messages do not arrive.'
      );
    } else if (sub?.wabaSubscribed) {
      setWebhookSubscribeMessage('Webhooks auto-subscribed on connect.');
      setWebhookSubscribed(true);
    }

    const sync = data?.coexistenceSync;
    if (data?.connectionMode === 'app_coexistence') {
      if (sync?.error) {
        const syncMsg = [sync.error, sync.details].filter(Boolean).join(' — ');
        setConnectError((prev) =>
          prev
            ? `${prev} Coexistence sync: ${syncMsg}`
            : `Connected, but initial sync needs attention: ${syncMsg}`
        );
      } else if (sync?.contactsRequestId || sync?.historyRequestId) {
        setWebhookSubscribeMessage(
          'WhatsApp Business App connected. Contact and chat history sync started — keep the mobile app open.'
        );
      }
    }
  };

  const handleDisconnectWhatsApp = async (phoneNumberId: string) => {
    try {
      await api.disconnectWhatsApp(phoneNumberId);
    } catch (err) {
      console.error(err);
    }
    const remaining = await loadWhatsappAccounts({ silent: true });
    onAccountsChanged?.();
    if (remaining.length === 0) {
      setNumbersFlow('selector');
      setConnectionType(null);
      setAutoLaunchSignup(false);
      localStorage.removeItem(CONNECTION_TYPE_STORAGE_KEY);
      localStorage.removeItem(BUSINESS_API_ONBOARDING_STEP_KEY);
    }
  };

  const showConnectionSelector =
    !hasWhatsappNumbers && numbersFlow === 'selector';
  const showBusinessApiGuide =
    !hasWhatsappNumbers && numbersFlow === 'business_api_guide';
  const showCoexistenceGuide =
    !hasWhatsappNumbers &&
    numbersFlow === 'coexistence_guide' &&
    connectionType === 'app_coexistence';
  const showBusinessApiConnect =
    !hasWhatsappNumbers &&
    numbersFlow === 'business_api_connect' &&
    connectionType === 'business_api';
  const showCoexistenceConnect =
    !hasWhatsappNumbers &&
    numbersFlow === 'coexistence_connect' &&
    connectionType === 'app_coexistence';

  const containerClass = hasWhatsappNumbers
    ? 'flex-1 space-y-6 max-w-7xl mx-auto pb-12 text-left selection:bg-sky-50'
    : 'flex-1 w-full max-w-none pb-12 text-left selection:bg-sky-50';

  if (accountsLoading) {
    return (
      <div className="flex-1 w-full pb-12 text-left selection:bg-sky-50">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="mt-4 text-sm font-bold text-gray-500">Checking WhatsApp numbers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {variant === 'integrations' && onBackToHub && (
        <button
          type="button"
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to integrations
        </button>
      )}

      {hasWhatsappNumbers && (
        <WhatsAppAccountManager
          accounts={whatsappAccounts}
          onDisconnect={handleDisconnectWhatsApp}
        />
      )}

      {showConnectionSelector && variant === 'integrations' && (
        <WhatsappConnectionSelector
          value={connectionType}
          onChange={setConnectionType}
          onGetStarted={handleGetStartedFromSelector}
        />
      )}

      {showConnectionSelector && variant !== 'integrations' && (
        <div className="max-w-lg mx-auto py-16 text-center space-y-5 animate-scale-up">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-primary flex items-center justify-center mx-auto">
            <Blocks className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-gray-950">Connect from Integrations</h4>
            <p className="text-sm text-gray-500 font-medium">
              WhatsApp and Instagram setup now lives in the Integrations tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(pathForTab('integrations'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-channel-green hover:bg-[#20bd5a] text-white rounded-xl text-sm font-black shadow-sm transition-all"
          >
            Open Integrations
          </button>
        </div>
      )}

      {showBusinessApiGuide && (
        <div className="max-w-4xl mx-auto">
          <BusinessApiOnboardingPage
            activeStep={1}
            onBack={handleChangeConnectionMethod}
            onStart={handleStartBusinessApiOnboarding}
            isStarting={isStartingApiSetup}
          />
        </div>
      )}

      {showCoexistenceGuide && (
        <div className="max-w-4xl mx-auto">
          <CoexistenceOnboardingPage
            activeStep={1}
            onBack={handleChangeConnectionMethod}
            onStart={handleStartCoexistenceOnboarding}
            isStarting={isStartingCoexistenceSetup}
          />
        </div>
      )}

      {showBusinessApiConnect && (
        <div className="max-w-3xl mx-auto space-y-4 animate-scale-up">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setNumbersFlow('business_api_guide')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to requirements
            </button>

            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(65,44,221,0.08)]">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-sky-50 text-primary border border-primary/20 mb-4">
                Step 2 — Connect Meta Account
              </span>
              <h4 className="text-xl font-black text-gray-950">Connect with Meta Business</h4>
              <p className="mt-2 text-sm text-gray-600 font-medium max-w-xl">
                Sign in with Facebook to link your Business Manager and continue WhatsApp Business
                API registration.
              </p>
              <WhatsAppEmbeddedSignup
                autoStart={autoLaunchSignup}
                onAutoStartConsumed={() => setAutoLaunchSignup(false)}
                onSuccess={handleConnectSuccess}
                onError={(error) => setConnectError(error)}
              />
              {connectError && (
                <p className="mt-3 text-sm font-bold text-red-500">{connectError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCoexistenceConnect && (
        <div className="max-w-3xl mx-auto space-y-4 animate-scale-up">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setNumbersFlow('coexistence_guide')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to requirements
            </button>

            <div className="bg-white border-2 border-[#25D366]/30 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(37,211,102,0.12)]">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-[#e6f7ec] text-[#006d2f] border border-[#5dfd8a]/30 mb-4">
                Step 2 — Connect WhatsApp
              </span>
              <h4 className="text-xl font-black text-gray-950">Connect with Meta</h4>
              <p className="mt-2 text-sm text-gray-600 font-medium max-w-xl">
                Sign in with Facebook to link your existing WhatsApp Business App. Your mobile app
                will keep working while permissions and data sync complete.
              </p>
              <WhatsAppEmbeddedSignup
                mode="app_coexistence"
                autoStart={autoLaunchSignup}
                onAutoStartConsumed={() => setAutoLaunchSignup(false)}
                onSuccess={handleConnectSuccess}
                onError={(error) => setConnectError(error)}
              />
              {connectError && (
                <p className="mt-3 text-sm font-bold text-red-500">{connectError}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
