/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quote, MessageSquare, Heart } from 'lucide-react';
import { TESTIMONIALS } from '../data';
import { PRODUCT_NAME } from '../brand';

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-[#FAF9FF] border-b border-gray-100 py-24 text-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-extrabold text-brand-indigo tracking-widest font-mono">
            Social Proof
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-gray-900 mt-2">
            Real businesses. Real results.
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 font-sans">
            Hear from leading marketing managers, educational institutes, and real estate agencies running automation under {PRODUCT_NAME}.
          </p>
        </div>

        {/* Featured Center quote block (Indigo/violet bg) */}
        <div className="bg-sky-600 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl shadow-brand-indigo/20 max-w-4xl mx-auto mb-12">
          {/* Abstract backdrop decoration */}
          <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-white/10 rounded-full blur-[80px] -z-1" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 sm:gap-8">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Quote className="w-6 h-6 text-white" />
            </div>
            
            <div className="space-y-6">
              <p className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed font-display">
                &ldquo;We replaced 3 different tools with {PRODUCT_NAME}. Our WhatsApp, Instagram, and Telegram are all in one place now. The AI agent handles 89% of student queries for our coaching institute. Best investment we made this year.&rdquo;
              </p>
              
              <div className="border-t border-white/20 pt-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm sm:text-base">Deepak Sharma</p>
                  <p className="text-xs text-indigo-200">Founder, ExamPilot EdTech • Delhi</p>
                </div>
                <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded font-mono font-bold">CASE STUDY APPROVED</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 smaller testimonial grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TESTIMONIALS.map((test) => (
            <div 
              key={test.id} 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 relative flex flex-col justify-between"
            >
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-indigo-100" />
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold italic">
                  "{test.quote}"
                </p>
              </div>

              <div className="border-t border-gray-50 pt-4 mt-6">
                <p className="text-xs font-bold text-gray-900">{test.author}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-0.5">
                  <span>{test.role}, {test.company}</span>
                  <span className="text-brand-indigo font-bold shrink-0">{test.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom indicator */}
        <div className="mt-12 flex items-center justify-center space-x-2 text-xs text-gray-400">
          <Heart className="w-4 h-[#EF4444] fill-[#EF4444]" />
          <span>Trusted by 1,240+ businesses in India and beyond</span>
        </div>

      </div>
    </section>
  );
}
