/**
 * EVENT REPLAY VIEWER
 * 
 * Displays state reconstruction from event stream with comparison to current database state.
 * Shows Turing Protocol compliance and chain integrity verification.
 */

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Link2, TrendingUp } from 'lucide-react';

interface EventReplayViewerProps {
  cattleId: number;
}

export function EventReplayViewer({ cattleId }: EventReplayViewerProps) {
  const { data, isLoading, error } = trpc.eventReplay.reconstructState.useQuery({ cattleId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to reconstruct state: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const { reconstructed_state, current_state, comparison, confidence, chain_integrity } = data;

  return (
    <div className="space-y-6">
      {/* Protocol Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Turing Protocol Compliance
          </CardTitle>
          <CardDescription>
            Cryptographic verification of event chain integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chain Integrity */}
            <div className="flex items-center gap-3">
              {chain_integrity.is_valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="text-sm font-medium">Chain Integrity</div>
                <div className="text-xs text-muted-foreground">
                  {chain_integrity.is_valid ? 'Valid' : `${chain_integrity.broken_links.length} broken links`}
                </div>
              </div>
            </div>

            {/* Event Count */}
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Event Count</div>
                <div className="text-xs text-muted-foreground">
                  {confidence.factors.event_count} events
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium">Confidence Score</div>
                <div className="text-xs text-muted-foreground">
                  {confidence.score}/100
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Factors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{confidence.factors.event_count}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{confidence.factors.completeness}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{confidence.factors.time_coverage_days}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {chain_integrity.is_valid ? '✓' : '✗'}
              </div>
              <div className="text-xs text-muted-foreground">Integrity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* State Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>State Comparison</span>
            <Badge variant={
              comparison.integrity_status === 'MATCH' ? 'default' :
              comparison.integrity_status === 'PARTIAL_MATCH' ? 'secondary' : 'destructive'
            }>
              {comparison.integrity_status.replace('_', ' ')}
            </Badge>
          </CardTitle>
          <CardDescription>
            Comparing current database state with reconstructed state from events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparison.differences.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Perfect match! Current database state matches the reconstructed state from events.
                This proves the Golden Record is the source of truth.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {comparison.differences.length} difference(s) detected between current state and event stream.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {comparison.differences.map((diff, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{diff.field}</div>
                      <div className="text-sm text-muted-foreground">
                        Current: <span className="font-mono">{JSON.stringify(diff.current_value)}</span>
                        {' → '}
                        Reconstructed: <span className="font-mono">{JSON.stringify(diff.reconstructed_value)}</span>
                      </div>
                    </div>
                    <Badge variant={
                      diff.severity === 'CRITICAL' ? 'destructive' :
                      diff.severity === 'WARNING' ? 'secondary' : 'outline'
                    }>
                      {diff.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconstructed State Details */}
      <Card>
        <CardHeader>
          <CardTitle>Reconstructed State</CardTitle>
          <CardDescription>
            Complete cattle state rebuilt from {reconstructed_state.total_events} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(reconstructed_state).map(([key, value]) => {
              if (key === 'cattle_id' || key === 'total_events' || key.includes('timestamp')) {
                return null;
              }
              return (
                <div key={key} className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</div>
                  <div className="font-medium">{value?.toString() || 'N/A'}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">First Event</div>
              <div className="font-medium">
                {reconstructed_state.first_event_at ? new Date(reconstructed_state.first_event_at).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Event</div>
              <div className="font-medium">
                {reconstructed_state.last_event_at ? new Date(reconstructed_state.last_event_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
