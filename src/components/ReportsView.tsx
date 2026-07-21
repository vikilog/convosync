/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  Clock, 
  Zap, 
  ThumbsUp,
  User,
  MoreVertical,
  Check
} from 'lucide-react';
import { TEAM_MEMBERS } from '../types';

export const ReportsView: React.FC = () => {
  // Weekly conversion statistics data
  const reportsData = [
    { label: 'Conversations Handled', value: '4,842', trend: '+14% vs last week', icon: MessageCircle, color: 'text-primary bg-sky-50' },
    { label: 'Resolution Rate', value: '92.4%', trend: '+1.2% in resolution', icon: Zap, color: 'text-accent-green bg-[#e6f7ec]' },
    { label: 'Avg CSAT Index', value: '4.7 / 5.0', trend: '98% Positive Feedback', icon: ThumbsUp, color: 'text-[#f2994a] bg-[#fff5e6]' },
    { label: 'Inbound Qualified Rate', value: '1,240', trend: '+8.4% qualified', icon: TrendingUp, color: 'text-sky-600 bg-sky-50' }
  ];

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 text-left selection:bg-sky-50">
      
      {/* HEADER CONTROLS WITH DATE RANGE SELECTORS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface border border-black/5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01)] select-none">
        <div>
          <h3 className="font-display font-black text-gray-900 text-base leading-none">Reports & Operational Intelligence</h3>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">Analyze conversation metrics, response times, and agent resolution ratings.</p>
        </div>

        {/* Date Selector range select */}
        <div className="flex items-center gap-2 bg-surface-muted p-1.5 rounded-xl border border-black/5">
          <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
          <select className="bg-transparent border-none text-sm font-bold text-gray-800 focus:ring-0 cursor-pointer focus:outline-none">
            <option>Today: Oct 24, 2026</option>
            <option>Last 7 Days (Oct 17 - Oct 24)</option>
            <option>Last 30 Days (Oct 1 - Oct 24)</option>
          </select>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportsData.map((data, idx) => {
          const Icon = data.icon;
          return (
            <div key={idx} className="bg-surface p-5 rounded-2xl border border-black/5 hover:border-primary/10 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${data.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-400 text-xs uppercase font-extrabold tracking-wider">{data.label}</p>
              <h3 className="text-xl font-black text-gray-900 mt-2 font-mono">{data.value}</h3>
              <p className="text-xs text-accent-green font-bold flex items-center gap-1 mt-1 font-mono">
                {data.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* CHARTS GRAPH COMPONENT RENDERING HISTOGRAM BINS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Hour density */}
        <div className="lg:col-span-8 bg-surface border border-black/5 p-6 rounded-2xl flex flex-col text-left">
          <div className="mb-6">
            <h4 className="font-bold text-gray-950 text-sm">Response loops hourly density</h4>
            <p className="text-xs text-gray-400">Activity volume distributed across corporate operating hours</p>
          </div>

          <div className="h-60 flex items-end justify-between px-2 gap-4 pt-10 border-b border-gray-100">
            {/* Render 10 hourly bin columns */}
            {[
              { time: '09:00', vol: 35, q: 12 },
              { time: '10:00', vol: 55, q: 22 },
              { time: '11:00', vol: 70, q: 38 },
              { time: '12:00', vol: 90, q: 55 },
              { time: '13:00', vol: 45, q: 15 },
              { time: '14:00', vol: 60, q: 30 },
              { time: '15:00', vol: 80, q: 42 },
              { time: '16:00', vol: 85, q: 48 },
              { time: '17:00', vol: 65, q: 28 },
              { time: '18:00', vol: 40, q: 10 }
            ].map((bin, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative h-40 flex items-end gap-0.5 justify-center">
                  
                  {/* Detailed tooltip */}
                  <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-meta rounded px-2 py-0.5 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-mono">
                    Volume: {bin.vol} • Qual: {bin.q}
                  </div>

                  <div 
                    className="w-1.5 bg-primary rounded-t-xs hover:opacity-90 transition-all duration-500" 
                    style={{ height: `${bin.vol}%` }}
                  />
                  <div 
                    className="w-1.5 bg-accent-green rounded-t-xs hover:opacity-90 transition-all duration-500" 
                    style={{ height: `${bin.q}%` }}
                  />
                </div>
                <span className="text-meta font-mono font-bold text-gray-400">{bin.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard details columns */}
        <div className="lg:col-span-4 bg-surface border border-black/5 rounded-2xl flex flex-col overflow-hidden h-[360px]">
          <div className="p-4 border-b border-black/5 bg-surface-muted text-left">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Agent Lead Conversion</h4>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-55">
            {TEAM_MEMBERS.map((member, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                    {member.initials}
                  </div>
                  <div className="text-left font-serif">
                    <p className="text-sm font-bold text-gray-900 font-sans">{member.name}</p>
                    <p className="text-xs text-gray-400 font-bold font-sans mt-0.5">Rating CSAT: {member.csat} / 5.0</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-primary bg-[#e6f7ec]/60 border border-[#5dfd8a]/20 px-2.5 py-1 rounded-xl text-accent-green">
                    {member.csat >= 4.8 ? 'Top Tier' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
