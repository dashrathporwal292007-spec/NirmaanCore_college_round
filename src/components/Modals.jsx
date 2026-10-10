import React, { useState } from 'react';
import { useNexus } from '../context/NexusContext';

export function LandingPagePreviewModal({ isOpen, onClose }) {
  const { webinar, addContact } = useNexus();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);

  if (!isOpen) return null;

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    addContact({
      name,
      email,
      company: 'Student Attendee',
      status: 'Qualified',
      source: 'Webinar Landing Page (/events/ai-students)',
      tags: '#edu-discount, live-registration'
    });
    setRegistered(true);
    setTimeout(() => {
      setRegistered(false);
      setName('');
      setEmail('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant">
        {/* Browser Top Chrome */}
        <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono text-outline ml-2 px-2 py-0.5 bg-surface-container rounded">
              nexus.app/events/ai-students
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Generated Landing Page Content */}
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="relative rounded-xl overflow-hidden h-40 bg-surface-container-highest">
            <img
              src={webinar.imageUrl}
              alt="Webinar Masterclass"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-background/85 via-black/20 to-transparent flex flex-col justify-end p-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-on-primary w-fit mb-1">
                Live Workshop
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">
                AI for Modern Builders: System Design Masterclass
              </h2>
              <span className="text-xs text-white/80 font-medium">
                June 4, 2026 • 2:00 PM EST • 100 Seats Target
              </span>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant">
            Learn end-to-end multi-agent orchestration, function calling, safe execution guardrails, and real-time event analytics. Includes live coding templates and student credit packs.
          </p>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-outline mb-2">
              Claim Your Student Seat
            </h3>
            {registered ? (
              <div className="p-3 rounded-lg bg-[#ECFDF5] text-[#065F46] flex items-center gap-2 text-sm font-medium">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                Seat reserved! Contact record added to CRM with #edu-discount.
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant"
                />
                <input
                  type="email"
                  placeholder="Student or University Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant"
                />
                <button
                  type="submit"
                  className="w-full h-9 bg-primary hover:bg-primary-container text-on-primary font-medium text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>Register Free Attendee</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignReviewModal({ isOpen, onClose, onApprove }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant">
        <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">mark_email_read</span>
            <span className="font-semibold text-on-surface text-sm">Campaign Draft Review (Draft #CP-401)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-2 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant text-xs">
            <div className="flex justify-between">
              <span className="text-outline">Subject Line:</span>
              <span className="font-semibold text-on-surface">You're invited: AI for Modern Builders Masterclass</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Target Audience:</span>
              <span className="font-semibold text-primary">684 Verified Registrants (#edu-discount)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Sender Provider:</span>
              <span className="text-on-surface">Acme Mail Engine (Simulated Sandbox)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Policy Intercept:</span>
              <span className="text-[#92400E] font-medium">Requires explicit human authorization</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant text-xs space-y-2 font-mono text-on-surface-variant">
            <p>Hi {'{{first_name}}'},</p>
            <p>
              Your pass for the <strong>AI-Powered Growth Masterclass</strong> is ready. We have activated your session credentials and curated starter code pack for the June 4 event.
            </p>
            <p>
              Access your personalized attendee workspace: <span className="text-primary underline">nexus.app/events/ai-students</span>
            </p>
            <p>Best regards,<br/>The Acme Team</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApprove();
                onClose();
              }}
              className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-medium shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Authorize & Send Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
