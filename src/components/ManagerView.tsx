/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Globe, ShieldAlert, Plus, ArrowLeft, Blocks } from 'lucide-react';
import { pathForTab } from '../routes';
import { api } from '../lib/api';
import {
  BusinessApiOnboardingPage,
  CoexistenceOnboardingPage,
  WhatsappConnectionSelector,
  type WhatsAppConnectionType,
} from './whatsapp';
import WhatsAppEmbeddedSignup from './WhatsAppEmbeddedSignup';

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

type WhatsAppPhoneAccount = {
  id: string;
  phoneNumberId: string;
  label: string;
  phone: string;
  dailyLimit: string;
  qosRating: string;
  status: string;
  verified: boolean;
};

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
  const [activeTab, setActiveTab] = useState<'numbers' | 'webhooks'>('numbers');

  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppPhoneAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [connectError, setConnectError] = useState('');
  const [showAddNumber, setShowAddNumber] = useState(false);
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
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [webhookSubscribed, setWebhookSubscribed] = useState<boolean | null>(null);
  const [webhookOverrideUri, setWebhookOverrideUri] = useState('');
  const [webhookSubscribeMessage, setWebhookSubscribeMessage] = useState('');
  const [webhookSubscribing, setWebhookSubscribing] = useState(false);
  const [copyHint, setCopyHint] = useState('');
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

  const loadWebhookStatus = useCallback(async () => {
    const status = (await api.getWhatsAppStatus()) as {
      webhookUrl?: string;
      webhookVerifyToken?: string;
      webhookSubscription?: {
        subscribed: boolean;
        overrideCallbackUri?: string;
      };
    };
    setWebhookUrl(status.webhookUrl || '');
    setWebhookVerifyToken(status.webhookVerifyToken || '');
    setWebhookSubscribed(status.webhookSubscription?.subscribed ?? null);
    setWebhookOverrideUri(status.webhookSubscription?.overrideCallbackUri || '');
    return status;
  }, []);

  useEffect(() => {
    if (activeTab !== 'webhooks' || !hasWhatsappNumbers) return;
    loadWebhookStatus().catch(console.error);
  }, [activeTab, hasWhatsappNumbers, loadWebhookStatus]);

  const handleSubscribeWebhooks = async () => {
    setWebhookSubscribing(true);
    setWebhookSubscribeMessage('');
    try {
      const res = (await api.subscribeWhatsAppWebhooks()) as {
        webhookSubscribe?: { error?: string; details?: string; wabaSubscribed?: boolean };
        webhookSubscription?: { subscribed: boolean; overrideCallbackUri?: string };
      };
      setWebhookSubscribed(res.webhookSubscription?.subscribed ?? res.webhookSubscribe?.wabaSubscribed ?? false);
      setWebhookOverrideUri(res.webhookSubscription?.overrideCallbackUri || webhookUrl);
      const sub = res.webhookSubscribe;
      if (sub?.error) {
        setWebhookSubscribeMessage(sub.error);
      } else if (sub?.details) {
        setWebhookSubscribeMessage(sub.details);
      } else {
        setWebhookSubscribeMessage('Webhooks subscribed via Meta API.');
      }
    } catch (err) {
      setWebhookSubscribeMessage(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setWebhookSubscribing(false);
    }
  };

  const copyWebhookUrl = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopyHint('Copied!');
      setTimeout(() => setCopyHint(''), 2000);
    } catch {
      setCopyHint('Copy failed');
    }
  };

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
        setShowAddNumber(false);
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
  }) => {
    setConnectError('');
    setAutoLaunchSignup(false);
    setShowAddNumber(false);
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

  const handleConnectAnotherAccount = () => {
    setConnectError('');
    setConnectionType('business_api');
    setShowAddNumber(true);
    setAutoLaunchSignup(true);
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
        <>
          <div>
            <h3 className="font-sans font-black text-gray-900 text-lg leading-none">
              WhatsApp Account Manager & Settings
            </h3>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Verify Meta API phone accounts and inspect webhook integration callbacks.
            </p>
          </div>

          <div className="flex border-b border-slate-200 select-none">
            <button
              type="button"
              onClick={() => setActiveTab('numbers')}
              className={`px-4 py-2 text-sm font-bold transition-all border-b-2 mr-3 ${
                activeTab === 'numbers'
                  ? 'text-primary border-primary font-black'
                  : 'text-gray-400 hover:text-gray-700 border-transparent'
              }`}
            >
              WhatsApp Numbers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('webhooks')}
              className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'webhooks'
                  ? 'text-primary border-primary font-black'
                  : 'text-gray-400 hover:text-gray-700 border-transparent'
              }`}
            >
              Webhooks & Integration Callback
            </button>
          </div>
        </>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-black shadow-sm transition-all"
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
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-sm font-black shadow-md transition-all"
              >
                Continue with Facebook
              </button>
            </div>
          </div>
        </div>
      )}

      {hasWhatsappNumbers && activeTab === 'numbers' && (
        <div className="space-y-4 animate-scale-up max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">
              Active WhatsApp Business Phone Accounts
            </h4>
            {!showAddNumber && (
              <button
                type="button"
                onClick={handleConnectAnotherAccount}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-meta font-bold shadow-sm shadow-primary/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Connect new account
              </button>
            )}
          </div>

          <div className="space-y-4 text-left">
            {whatsappAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-[#e6f7ec] text-accent-green rounded-xl shrink-0">
                    <Smartphone className="w-6 h-6 text-accent-green" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm leading-none flex items-center gap-2">
                      {account.label}
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block" />
                    </h5>
                    <p className="text-sm font-black text-gray-500 font-mono mt-1.5">
                      {account.phone}
                    </p>
                    <div className="flex gap-4 mt-3 text-sm font-bold text-gray-400 font-mono flex-wrap">
                      <span>
                        Daily Limit: <strong className="text-gray-800">{account.dailyLimit}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        QoS Rating: <strong className="text-accent-green">{account.qosRating}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Status: <strong className="text-accent-green">{account.status}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                {account.verified && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold uppercase tracking-widest text-[#006d2f] bg-[#e6f7ec] px-3 py-1 rounded-full border border-[#5dfd8a]/20">
                      Meta Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDisconnectWhatsApp(account.phoneNumberId)}
                      className="text-sm font-extrabold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ))}

            {showAddNumber && (
              <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(65,44,221,0.08)]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-lg font-black text-gray-950">Connect another number</h4>
                    <p className="mt-1 text-sm text-gray-600 font-medium">
                      Sign in with Meta to add another WhatsApp Business phone to this workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNumber(false);
                      setAutoLaunchSignup(false);
                      setConnectError('');
                    }}
                    className="text-sm font-bold text-gray-500 hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
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
            )}
          </div>
        </div>
      )}

      {hasWhatsappNumbers && activeTab === 'webhooks' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 text-left animate-scale-up select-none max-w-2xl">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="font-bold text-gray-950 text-sm flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-primary" /> Integrated webhook configs
            </h4>
            <p className="text-xs text-gray-400 font-bold mt-1 leading-none">
              On connect, ConvoSync registers this callback with Meta via API. Use retry if you change
              your tunnel URL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-primary/15">
            <div className="flex-1 min-w-[140px]">
              <p className="text-sm font-black uppercase text-gray-400 tracking-wider">
                API subscription
              </p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {webhookSubscribed === null
                  ? 'Checking…'
                  : webhookSubscribed
                    ? 'Subscribed to WABA webhooks'
                    : 'Not subscribed yet'}
              </p>
              {webhookOverrideUri && (
                <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                  Override: {webhookOverrideUri}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSubscribeWebhooks}
              disabled={webhookSubscribing}
              className="px-4 py-2 text-sm font-black text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-60"
            >
              {webhookSubscribing ? 'Subscribing…' : 'Subscribe via API'}
            </button>
          </div>

          {webhookSubscribeMessage && (
            <p className="text-sm font-semibold text-gray-600 bg-gray-50 border border-slate-200 rounded-lg px-3 py-2">
              {webhookSubscribeMessage}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black uppercase text-gray-400 tracking-wider mb-1.5">
                Target Webhook URL Endpoint
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl || 'Loading…'}
                  className="w-full bg-gray-50 border border-border-subtle rounded-xl py-2 px-3 text-sm focus:ring-0 outline-none text-gray-500 font-mono select-all"
                />
                <button
                  type="button"
                  className="px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-xl transition-colors border border-border-subtle shrink-0"
                  onClick={copyWebhookUrl}
                  disabled={!webhookUrl}
                >
                  {copyHint || 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black uppercase text-gray-400 tracking-wider mb-1.5">
                Verify secret token
              </label>
              <input
                type="text"
                readOnly
                value={webhookVerifyToken || 'Loading…'}
                className="w-full bg-slate-50 border border-border-subtle rounded-xl py-2 px-3 text-xs outline-none text-gray-500 font-mono select-all"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Same token as <span className="font-mono">META_WEBHOOK_VERIFY_TOKEN</span> on the
                server. Manual Meta Console setup is optional if API subscribe succeeds.
              </p>
            </div>

            <div className="p-4 bg-orange-50 border border-warning-orange/15 rounded-xl flex gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-warning-orange shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-warning-orange leading-none uppercase tracking-wider mb-1">
                  Verify Webhook Payload compliance
                </p>
                <p className="text-xs text-gray-400 font-bold leading-normal">
                  WhatsApp Cloud API verifies webhook connection by dispatching verification
                  parameters. Please assert verify token checks are matched on your receiver server
                  code prior to launching.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
