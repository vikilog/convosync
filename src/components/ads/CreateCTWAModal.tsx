import React, { useState } from 'react';
import { Check, Image as ImageIcon, Zap } from 'lucide-react';
import { fmt, fmtInr } from './utils';

export type CTWAFormData = {
  campaignName: string;
  dailyBudget: number;
  headline: string;
  description: string;
  ageMin: number;
  ageMax: number;
  locations: string;
  startDate: string;
};

export const CreateCTWAModal: React.FC<{
  onClose: () => void;
  onCreate: (data: CTWAFormData) => void | Promise<void>;
  creating?: boolean;
}> = ({ onClose, onCreate, creating }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CTWAFormData>({
    campaignName: '',
    dailyBudget: 500,
    headline: '',
    description: '',
    ageMin: 18,
    ageMax: 45,
    locations: 'India',
    startDate: '',
  });

  const update = <K extends keyof CTWAFormData>(k: K, v: CTWAFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600" />
              Create Click-to-WhatsApp Ad
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Step {step} of 3 · Meta Ads</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 font-bold text-lg cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-4">
          {['Campaign', 'Creative', 'Audience'].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-1.5 text-sm font-bold ${
                  step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-sky-600' : 'text-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-sm font-black ${
                    step > i + 1 ? 'bg-green-100' : step === i + 1 ? 'bg-sky-50' : 'bg-gray-100'
                  }`}
                >
                  {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {s}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 rounded ${step > i + 1 ? 'bg-green-200' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label htmlFor="ctwa-campaign-name" className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Campaign Name
                </label>
                <input
                  id="ctwa-campaign-name"
                  value={form.campaignName}
                  onChange={(e) => update('campaignName', e.target.value)}
                  placeholder="e.g. Diwali Sale — WhatsApp Leads"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label htmlFor="ctwa-daily-budget" className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Daily Budget (₹)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="ctwa-daily-budget"
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={form.dailyBudget}
                    onChange={(e) => update('dailyBudget', Number(e.target.value))}
                    className="flex-1 accent-sky-600"
                  />
                  <span className="text-sm font-black text-sky-600 min-w-[60px] text-right">
                    {fmtInr(form.dailyBudget)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Est. reach: {fmt(form.dailyBudget * 40)}–{fmt(form.dailyBudget * 80)} people/day
                </p>
              </div>
              <div>
                <label htmlFor="ctwa-start-date" className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Start Date
                </label>
                <input
                  id="ctwa-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="ctwa-headline" className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Ad Headline
                </label>
                <input
                  id="ctwa-headline"
                  value={form.headline}
                  onChange={(e) => update('headline', e.target.value)}
                  placeholder="e.g. Chat with us on WhatsApp!"
                  maxLength={40}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
                <p className="text-xs text-gray-500 mt-1">{form.headline.length}/40 characters</p>
              </div>
              <div>
                <label htmlFor="ctwa-description" className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  id="ctwa-description"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="e.g. Get instant answers. Click to start a WhatsApp conversation with our team."
                  rows={3}
                  maxLength={125}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/125 characters</p>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-600">Upload Ad Image</p>
                <p className="text-xs text-gray-500 mt-0.5">Recommended: 1200×628px, JPG or PNG, max 30MB</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">Ad Preview</p>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="h-28 bg-sky-50 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-sky-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-black text-gray-900">{form.headline || 'Your headline here'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.description || 'Your description here'}</p>
                    <div className="mt-2 bg-[#25D366] text-white text-sm font-black py-1.5 px-3 rounded-lg text-center">
                      Send WhatsApp Message
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label htmlFor="ctwa-locations" className="text-sm font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                  Target Locations
                </label>
                <input
                  id="ctwa-locations"
                  value={form.locations}
                  onChange={(e) => update('locations', e.target.value)}
                  placeholder="India, Mumbai, Delhi..."
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <p className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">
                  Age Range: {form.ageMin}–{form.ageMax} years
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">Min</span>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={form.ageMin}
                      onChange={(e) => update('ageMin', Number(e.target.value))}
                      className="flex-1 accent-sky-600"
                      aria-label="Minimum age"
                    />
                    <span className="text-sm font-bold text-sky-600 w-8">{form.ageMin}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">Max</span>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={form.ageMax}
                      onChange={(e) => update('ageMax', Number(e.target.value))}
                      className="flex-1 accent-sky-600"
                      aria-label="Maximum age"
                    />
                    <span className="text-sm font-bold text-sky-600 w-8">{form.ageMax}</span>
                  </div>
                </div>
              </div>
              <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-black text-sky-700 uppercase tracking-wider">Campaign Summary</p>
                {[
                  ['Name', form.campaignName || '—'],
                  ['Daily Budget', fmtInr(form.dailyBudget)],
                  ['Headline', form.headline || '—'],
                  ['Audience', `${form.ageMin}–${form.ageMax} yrs • ${form.locations}`],
                  ['Objective', 'Click-to-WhatsApp (MESSAGES)'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">{k}</span>
                    <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-slate-200">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="px-4 py-2 text-sm font-bold text-gray-600 border border-slate-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            type="button"
            onClick={step === 3 ? () => void onCreate(form) : () => setStep((s) => s + 1)}
            disabled={(step === 1 && !form.campaignName) || creating}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            {creating ? (
              'Launching…'
            ) : step === 3 ? (
              <>
                <Zap className="w-3.5 h-3.5" /> Launch Ad
              </>
            ) : (
              <>Next Step →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
