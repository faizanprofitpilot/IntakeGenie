'use client';

import { Call, IntakeData, SummaryData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CallDetailProps {
  call: Call;
}

export default function CallDetail({ call }: CallDetailProps) {
  const intake = (call.intake_json as IntakeData) || {};
  const summary = (call.summary_json as SummaryData) || null;

  return (
    <div className="space-y-6">
      {/* Call Metadata */}
      <div 
        className="bg-white rounded-xl shadow-sm p-8"
        style={{
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
            Call Information
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
              Caller Number
            </dt>
            <dd className="text-sm" style={{ color: '#0B1F3B' }}>{call.from_number}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
              Started At
            </dt>
            <dd className="text-sm" style={{ color: '#0B1F3B' }}>
              {new Date(call.started_at).toLocaleString()}
            </dd>
          </div>
          {call.ended_at && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Ended At
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>
                {new Date(call.ended_at).toLocaleString()}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
              Route Reason
            </dt>
            <dd className="text-sm capitalize" style={{ color: '#0B1F3B' }}>
              {call.route_reason?.replace('_', ' ')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
              Status
            </dt>
            <dd className="text-sm" style={{ color: '#0B1F3B' }}>{call.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
              Urgency
            </dt>
            <dd className="text-sm capitalize" style={{ color: '#0B1F3B' }}>{call.urgency}</dd>
          </div>
        </dl>
      </div>

      {/* Structured Intake */}
      <div 
        className="bg-white rounded-xl shadow-sm p-8"
        style={{
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
            Intake Information
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {intake.full_name && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Full Name
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.full_name}</dd>
            </div>
          )}
          {intake.callback_number && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Callback Number
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.callback_number}</dd>
            </div>
          )}
          {intake.email && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Email
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.email}</dd>
            </div>
          )}
          {intake.reason_for_call && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Reason for Call
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.reason_for_call}</dd>
            </div>
          )}
          {intake.incident_date_or_timeframe && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Incident Date/Timeframe
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.incident_date_or_timeframe}</dd>
            </div>
          )}
          {intake.incident_location && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Location
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.incident_location}</dd>
            </div>
          )}
          {intake.injury_description && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Injury Description
              </dt>
              <dd className="text-sm" style={{ color: '#0B1F3B' }}>{intake.injury_description}</dd>
            </div>
          )}
          {intake.medical_treatment_received && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Medical Treatment
              </dt>
              <dd className="text-sm capitalize" style={{ color: '#0B1F3B' }}>
                {intake.medical_treatment_received}
              </dd>
            </div>
          )}
          {intake.insurance_involved && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A5D73' }}>
                Insurance Involved
              </dt>
              <dd className="text-sm capitalize" style={{ color: '#0B1F3B' }}>
                {intake.insurance_involved}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Summary */}
      {summary && (
        <div 
          className="bg-white rounded-xl shadow-sm p-8"
          style={{
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
              {summary.title}
            </h2>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4A5D73' }}>
                Summary
              </h4>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#0B1F3B' }}>
                {summary.summary_bullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>

            {Object.keys(summary.key_facts).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4A5D73' }}>
                  Key Facts
                </h4>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
                  {summary.key_facts.incident_date && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4A5D73' }}>
                        Incident Date:
                      </dt>
                      <dd style={{ color: '#0B1F3B' }}>{summary.key_facts.incident_date}</dd>
                    </>
                  )}
                  {summary.key_facts.location && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4A5D73' }}>
                        Location:
                      </dt>
                      <dd style={{ color: '#0B1F3B' }}>{summary.key_facts.location}</dd>
                    </>
                  )}
                  {summary.key_facts.injuries && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4A5D73' }}>
                        Injuries:
                      </dt>
                      <dd style={{ color: '#0B1F3B' }}>{summary.key_facts.injuries}</dd>
                    </>
                  )}
                  {summary.key_facts.treatment && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4A5D73' }}>
                        Treatment:
                      </dt>
                      <dd style={{ color: '#0B1F3B' }}>{summary.key_facts.treatment}</dd>
                    </>
                  )}
                  {summary.key_facts.insurance && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4A5D73' }}>
                        Insurance:
                      </dt>
                      <dd style={{ color: '#0B1F3B' }}>{summary.key_facts.insurance}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            {summary.action_items.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4A5D73' }}>
                  Action Items
                </h4>
                <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#0B1F3B' }}>
                  {summary.action_items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4A5D73' }}>
                Follow-up Recommendation
              </h4>
              <p className="text-sm" style={{ color: '#0B1F3B' }}>{summary.follow_up_recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transcript */}
      {call.transcript_text && (
        <div 
          className="bg-white rounded-xl shadow-sm p-8"
          style={{
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
              Transcript
            </h2>
          </div>
          <div className="rounded-xl p-6 overflow-hidden" style={{ backgroundColor: '#F5F7FA' }}>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#0B1F3B' }}>
              {call.transcript_text}
            </pre>
          </div>
        </div>
      )}

      {/* Recording */}
      {call.recording_url && (
        <div 
          className="bg-white rounded-xl shadow-sm p-8"
          style={{
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#4A5D73' }}>
              Recording
            </h2>
          </div>
          <Button 
            asChild
            className="h-12 px-6 rounded-lg font-semibold cursor-pointer"
            style={{ backgroundColor: '#0B1F3B', color: '#FFFFFF' }}
          >
            <a
              href={call.recording_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Listen to Recording
            </a>
          </Button>
        </div>
      )}

      {/* Error Message */}
      {call.error_message && (
        <div 
          className="bg-white rounded-xl shadow-sm p-8 border-2"
          style={{
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            borderColor: '#DC2626',
          }}
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#DC2626' }}>
              Error
            </h2>
          </div>
          <p className="text-sm" style={{ color: '#DC2626' }}>{call.error_message}</p>
        </div>
      )}
    </div>
  );
}

