import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { GoogleToolProduct } from '../../../lib/googleTools';
import { pathForTab } from '../../../routes';
import { BusinessProfileSidebar } from './BusinessProfileSidebar';
import {
  BusinessProfileBanner,
  BusinessProfileHeader,
  BusinessProfileLoadingState,
} from './BusinessProfileHeader';
import { BusinessProfileLocationDetail } from './BusinessProfileLocationDetail';
import { BusinessProfileLocationList } from './BusinessProfileLocationList';
import { useBusinessProfile } from './useBusinessProfile';

type GoogleBusinessProfileViewProps = {
  connectedTools: GoogleToolProduct[];
};

export function GoogleBusinessProfileView({ connectedTools }: GoogleBusinessProfileViewProps) {
  const navigate = useNavigate();
  const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bp = useBusinessProfile();

  if (!bp.loading && !bp.integration) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-slate-50">
        <div className="max-w-md text-center rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-[0_4px_24px_rgba(52,168,83,0.06)]">
          <MapPin className="w-10 h-10 mx-auto text-[#34A853] mb-4" />
          <h2 className="text-lg font-black text-gray-950">Business Profile not connected</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Connect Google Business Profile from Integrations → Google to manage locations here.
          </p>
          <button
            type="button"
            onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
            className="mt-5 px-4 py-2.5 rounded-xl bg-[#34A853] text-white text-sm font-bold shadow-[0_2px_8px_rgba(52,168,83,0.25)]"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  if (bp.loading) {
    return <BusinessProfileLoadingState label="Loading Business Profile…" />;
  }

  const showList = mobilePane === 'list';
  const showDetail = mobilePane === 'detail';

  return (
    <div className="flex h-full w-full min-w-0 max-w-full overflow-hidden bg-white">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 lg:z-auto h-full shrink-0 transition-transform duration-200 ease-out shadow-xl lg:shadow-none`}
      >
        <BusinessProfileSidebar
          email={bp.integration?.connectionEmail}
          connectedTools={connectedTools}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <BusinessProfileHeader
          accounts={bp.accounts}
          selectedAccountId={bp.selectedAccountId}
          onAccountChange={bp.setSelectedAccountId}
          lastSyncAt={bp.syncStatus?.lastSync.accounts ?? bp.integration?.lastSyncAt ?? null}
          syncing={bp.syncing}
          onSync={() => void bp.handleSyncAccounts()}
          onSettings={() => navigate(`${pathForTab('integrations')}?channel=google&gbp=sync`)}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <BusinessProfileBanner message={bp.message} />

        <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <div
          className={`min-w-0 min-h-0 overflow-hidden ${
            showList ? 'flex w-full lg:w-auto' : 'hidden lg:flex'
          }`}
        >
          <BusinessProfileLocationList
            locations={bp.locations}
            selectedId={bp.selectedLocationId}
            onSelect={(id) => {
              bp.setSelectedLocationId(id);
              setMobilePane('detail');
            }}
            loading={bp.listLoading}
            searchQuery={bp.searchQuery}
            onSearchChange={bp.setSearchQuery}
            totalCount={bp.allLocations.length}
          />
        </div>

        <div
          className={`flex-1 min-w-0 min-h-0 overflow-hidden ${
            showDetail ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <BusinessProfileLocationDetail
            location={bp.selectedLocation}
            reviews={bp.reviews}
            metrics={bp.metrics}
            reviewsLoading={bp.reviewsLoading}
            metricsLoading={bp.metricsLoading}
            onLoadMetrics={() => {
              if (bp.integration?.connectionId && bp.selectedLocationId) {
                void bp.loadMetrics(bp.integration.connectionId, bp.selectedLocationId);
              }
            }}
            empty={!bp.selectedLocationId}
            showBack={mobilePane === 'detail'}
            onBack={() => setMobilePane('list')}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
