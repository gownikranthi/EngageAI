import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { eventService } from '../services/events';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

interface EventSummary {
  _id: string;
  eventId: string;
  summary: string;
  keyThemes?: string[];
  smartFAQs?: { question: string; answer: string }[];
  createdAt: string;
}

export const EventRewindPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!eventId) throw new Error('No event ID provided');
        const res = await eventService.getSummary(eventId);
        if (res && res.success && res.data) {
          setSummary(res.data);
        } else {
          setSummary(null);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch summary');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [eventId]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full p-4 sm:p-8">
        <div className="mb-6 flex items-center gap-4">
          <Link to={eventId ? `/event/${eventId}` : '/dashboard'}>
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Event
            </Button>
          </Link>
          <h1 className="text-hero text-foreground mb-0">Event Rewind</h1>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading event summary...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="text-title text-destructive mb-2">Failed to load summary</h2>
            <p className="text-body text-muted-foreground mb-4">{error}</p>
            <Button variant="default" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : !summary ? (
          <div className="text-center py-16">
            <h2 className="text-title text-foreground mb-2">No summary available</h2>
            <p className="text-body text-muted-foreground mb-4">The AI Scribe summary for this event is not available yet.</p>
          </div>
        ) : (
          <div className="card-primary p-6 animate-fade-in space-y-8">
            <div>
              <h2 className="text-subtitle text-primary mb-2">Summary</h2>
              <p className="text-body text-foreground whitespace-pre-line">{summary.summary}</p>
            </div>
            {summary.keyThemes && summary.keyThemes.length > 0 && (
              <div>
                <h3 className="text-subtitle text-primary mb-2">Key Themes</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {summary.keyThemes.map((theme, idx) => (
                    <li key={idx} className="text-body text-foreground">{theme}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.smartFAQs && summary.smartFAQs.length > 0 && (
              <div>
                <h3 className="text-subtitle text-primary mb-2">Smart FAQs</h3>
                <ul className="space-y-4">
                  {summary.smartFAQs.map((faq, idx) => (
                    <li key={idx} className="bg-accent/10 rounded-lg p-4">
                      <div className="font-semibold text-foreground mb-1">Q: {faq.question}</div>
                      <div className="text-body text-muted-foreground">A: {faq.answer}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-right text-xs text-muted-foreground mt-4">
              Generated: {new Date(summary.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventRewindPage; 