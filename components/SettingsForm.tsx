'use client';

import { useState, useEffect } from 'react';
import { Firm } from '@/types';
import { createBrowserClient } from '@/lib/clients/supabase';
import PhoneNumberDisplay from './PhoneNumberDisplay';

interface SettingsFormProps {
  firm: Firm | null;
  onSave: () => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'EST/EDT (Eastern)' },
  { value: 'America/Chicago', label: 'CST/CDT (Central)' },
  { value: 'America/Denver', label: 'MST/MDT (Mountain)' },
  { value: 'America/Los_Angeles', label: 'PST/PDT (Pacific)' },
  { value: 'America/Phoenix', label: 'MST (Arizona)' },
  { value: 'America/Anchorage', label: 'AKST/AKDT (Alaska)' },
  { value: 'Pacific/Honolulu', label: 'HST (Hawaii)' },
  { value: 'Europe/London', label: 'GMT/BST (London)' },
  { value: 'Europe/Paris', label: 'CET/CEST (Central European)' },
  { value: 'Europe/Berlin', label: 'CET/CEST (Berlin)' },
  { value: 'Europe/Madrid', label: 'CET/CEST (Madrid)' },
  { value: 'Europe/Rome', label: 'CET/CEST (Rome)' },
  { value: 'Asia/Dubai', label: 'GST (Dubai)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Asia/Hong_Kong', label: 'HKT (Hong Kong)' },
  { value: 'Australia/Sydney', label: 'AEST/AEDT (Sydney)' },
  { value: 'Australia/Melbourne', label: 'AEST/AEDT (Melbourne)' },
  { value: 'America/Toronto', label: 'EST/EDT (Toronto)' },
  { value: 'America/Vancouver', label: 'PST/PDT (Vancouver)' },
  { value: 'America/Mexico_City', label: 'CST/CDT (Mexico City)' },
  { value: 'America/Sao_Paulo', label: 'BRT/BRST (São Paulo)' },
];


export default function SettingsForm({ firm, onSave }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [manualTwilioNumber, setManualTwilioNumber] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createBrowserClient());
    }
  }, []);

  const [formData, setFormData] = useState({
    firm_name: firm?.firm_name || '',
    notify_emails: firm?.notify_emails?.join(', ') || '',
    timezone: firm?.timezone || 'America/New_York',
  });

  useEffect(() => {
    if (firm) {
      setFormData({
        firm_name: firm.firm_name,
        notify_emails: firm.notify_emails?.join(', ') || '',
        timezone: firm.timezone,
      });
    }
  }, [firm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const notifyEmailsArray = formData.notify_emails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (notifyEmailsArray.length === 0) {
        throw new Error('At least one notification email is required');
      }

      const firmData = {
        firm_name: formData.firm_name,
        notify_emails: notifyEmailsArray,
        timezone: formData.timezone,
      };

      let firmId: string;

      if (firm) {
        // Update existing firm
        firmId = firm.id;
        const { error: updateError } = await supabase
          .from('firms')
          // @ts-ignore - Supabase type inference issue
          .update(firmData)
          // @ts-ignore - Supabase type inference issue
          .eq('id', firm.id);

        if (updateError) throw updateError;
        
        // Phone number provisioning is now manual via the "Provision Phone Number" button
        // No auto-provisioning on save
      } else {
        // Create new firm
        // @ts-ignore - Supabase type inference issue
        const { data: newFirmData, error: insertError } = await supabase.from('firms').insert({
          ...firmData,
          owner_user_id: user.id,
        }).select().single();

        if (insertError) throw insertError;
        if (!newFirmData) throw new Error('Failed to create firm');
        
        const newFirm = newFirmData as any;
        firmId = newFirm.id;

        // Phone number provisioning is now manual via the "Provision Phone Number" button
        // No auto-provisioning on firm creation
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSave();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full max-w-[900px] mx-auto">
      {/* Success Toast */}
      {success && (
        <div 
          className="mb-6 border rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ 
            backgroundColor: '#F5F7FA',
            borderColor: '#0B1F3B',
            color: '#0B1F3B'
          }}
        >
          <span className="text-sm font-medium">Settings saved successfully</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-0">
        {/* Phone Number Display Section - Only show if number exists */}
        {firm && (firm.inbound_number_e164 || firm.vapi_phone_number || firm.twilio_number) && (
          <section className="pb-8 border-b border-gray-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
                Phone Number
              </h2>
              <p className="text-sm" style={{ color: '#4A5D73', opacity: 0.7 }}>
                Your provisioned phone number for receiving calls.
              </p>
            </div>

            <div className="space-y-5">
              {/* Display current number - matches dashboard display */}
              <PhoneNumberDisplay
                phoneNumber={
                  firm.inbound_number_e164 
                    ? firm.inbound_number_e164
                    : firm.vapi_phone_number && firm.vapi_phone_number.match(/^\+?[1-9]\d{1,14}$/)
                      ? firm.vapi_phone_number
                      : firm.twilio_number
                        ? firm.twilio_number
                        : null
                }
                formattedNumber={
                  firm.inbound_number_e164 
                    ? firm.inbound_number_e164.replace(/^\+?(\d{1})(\d{3})(\d{3})(\d{4})$/, '+$1 ($2) $3-$4')
                    : firm.vapi_phone_number && firm.vapi_phone_number.match(/^\+?[1-9]\d{1,14}$/) 
                      ? firm.vapi_phone_number.replace(/^\+?(\d{1})(\d{3})(\d{3})(\d{4})$/, '+$1 ($2) $3-$4')
                      : firm.twilio_number 
                        ? firm.twilio_number.replace(/^\+?(\d{1})(\d{3})(\d{3})(\d{4})$/, '+$1 ($2) $3-$4')
                        : firm.vapi_phone_number_id
                          ? 'Number being assigned...'
                          : 'No number assigned'
                }
                isPending={!!firm.vapi_phone_number_id && !firm.inbound_number_e164}
              />
              {firm.vapi_phone_number_id && !firm.inbound_number_e164 && (
                <p className="text-sm" style={{ color: '#4A5D73', opacity: 0.7 }}>
                  The number is being assigned. It will appear here automatically once ready.
                  {' '}
                  <a 
                    href={`https://dashboard.vapi.ai/phone-numbers/${firm.vapi_phone_number_id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View in Vapi Dashboard
                  </a>
                </p>
              )}
              {firm.inbound_number_e164 && firm.telephony_provider && (
                <p className="text-xs" style={{ color: '#4A5D73', opacity: 0.7 }}>
                  Provider: {firm.telephony_provider === 'twilio_imported_into_vapi' ? 'Twilio + Vapi' : firm.telephony_provider}
                </p>
              )}


              {/* Link Existing Phone Number - Only show if no number is provisioned */}
              {!firm.inbound_number_e164 && !firm.vapi_phone_number_id && !firm.twilio_phone_number_sid && (
                <details className="mt-4 p-3 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <summary className="text-xs font-semibold mb-2 cursor-pointer" style={{ color: '#4A5D73' }}>
                    Link Existing Vapi Phone Number (Advanced)
                  </summary>
                  <p className="text-xs mb-2 mt-2" style={{ color: '#4A5D73', opacity: 0.7 }}>
                    Only use this if you've already imported a phone number into Vapi manually (via the Vapi dashboard) and want to link it to this firm. For new numbers, use the "Provision Phone Number" button in the Dashboard.
                  </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="link_phone_number_id"
                    placeholder="Enter Vapi phone number ID"
                    className="flex-1 h-10 px-3 rounded-lg border text-sm"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && !loading) {
                        const phoneNumberId = (e.target as HTMLInputElement).value.trim();
                        if (!phoneNumberId || !supabase || !firm) return;
                        
                        setLoading(true);
                        setError(null);
                        
                        try {
                          const response = await fetch('/api/vapi/link-number', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                              firmId: firm.id,
                              phoneNumberId: phoneNumberId
                            }),
                          });

                          const data = await response.json();
                          
                          if (!response.ok) {
                            throw new Error(data.error || data.details || 'Failed to link number');
                          }

                          setSuccess(true);
                          (e.target as HTMLInputElement).value = '';
                          setTimeout(() => {
                            setSuccess(false);
                            onSave();
                          }, 2000);
                        } catch (err: any) {
                          console.error('Error linking number:', err);
                          setError(err.message || 'Failed to link number. Check browser console for details.');
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!supabase || !firm) return;
                      
                      const input = document.getElementById('link_phone_number_id') as HTMLInputElement;
                      const phoneNumberId = input?.value.trim();
                      
                      if (!phoneNumberId) {
                        setError('Please enter a phone number ID');
                        return;
                      }
                      
                      setLoading(true);
                      setError(null);
                      
                      try {
                        const response = await fetch('/api/vapi/link-number', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ 
                            firmId: firm.id,
                            phoneNumberId: phoneNumberId
                          }),
                        });

                        const data = await response.json();
                        
                        if (!response.ok) {
                          console.error('Link number error response:', data);
                          
                          let errorMsg = 'Failed to link number';
                          if (data.message && Array.isArray(data.message)) {
                            errorMsg = data.message.join(', ');
                          } else if (data.message && typeof data.message === 'string') {
                            errorMsg = data.message;
                          } else if (data.error) {
                            errorMsg = data.error;
                          } else if (data.details) {
                            if (typeof data.details === 'object' && data.details.message) {
                              errorMsg = Array.isArray(data.details.message) 
                                ? data.details.message.join(', ')
                                : data.details.message;
                            } else {
                              errorMsg = JSON.stringify(data.details);
                            }
                          }
                          
                          throw new Error(errorMsg);
                        }

                        setSuccess(true);
                        input.value = '';
                        setTimeout(() => {
                          setSuccess(false);
                          onSave();
                        }, 2000);
                      } catch (err: any) {
                        console.error('Error linking number:', err);
                        setError(err.message || 'Failed to link number. Check browser console for details.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="h-10 px-4 rounded-lg font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{
                      backgroundColor: loading ? '#4A5D73' : '#0B1F3B',
                      color: '#FFFFFF',
                    }}
                  >
                    Link Number
                  </button>
                </div>
                  <p className="text-xs mt-2" style={{ color: '#4A5D73', opacity: 0.7 }}>
                    Find the phone number ID in the Vapi dashboard URL: <code className="bg-gray-200 px-1 rounded">/phone-numbers/[ID]</code>
                  </p>
                </details>
              )}
            </div>
          </section>
        )}

        {/* Firm Information Section */}
        <section className="pb-8 border-b border-gray-200 last:border-b-0">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
              Firm Information
            </h2>
            <p className="text-sm" style={{ color: '#4A5D73', opacity: 0.7 }}>
              Basic details about your law firm
            </p>
          </div>

          <div className="space-y-5">
      <div>
              <label 
                htmlFor="firm_name" 
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: '#4A5D73' }}
              >
          Firm Name
        </label>
        <input
          type="text"
          id="firm_name"
          required
                className="w-full h-12 px-4 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0B1F3B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11, 31, 59, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
          value={formData.firm_name}
          onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
        />
      </div>

      <div>
              <label 
                htmlFor="notify_emails" 
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: '#4A5D73' }}
              >
                Notification Emails
        </label>
        <input
          type="text"
          id="notify_emails"
          required
                placeholder="email1@example.com, email2@example.com"
                className="w-full h-12 px-4 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0B1F3B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11, 31, 59, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
          value={formData.notify_emails}
          onChange={(e) => setFormData({ ...formData, notify_emails: e.target.value })}
        />
              <p className="mt-1.5 text-xs" style={{ color: '#4A5D73', opacity: 0.7 }}>
                Comma-separated list of email addresses
              </p>
      </div>

      <div>
              <label 
                htmlFor="timezone" 
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: '#4A5D73' }}
              >
          Timezone
        </label>
        <select
          id="timezone"
                className="w-full h-12 px-4 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0B1F3B';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11, 31, 59, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
        >
          {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
            </option>
          ))}
        </select>
      </div>
          </div>
        </section>


        {/* Save Button */}
        <div className="pt-6 border-t border-gray-200 sticky bottom-0 bg-white -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
        <button
          type="submit"
          disabled={loading}
            className="w-full h-12 rounded-lg font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading ? '#4A5D73' : '#0B1F3B',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (!loading && !e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#0A1A33';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#0B1F3B';
              }
            }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
    </div>
  );
}

