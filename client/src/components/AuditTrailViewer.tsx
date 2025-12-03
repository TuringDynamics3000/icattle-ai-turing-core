import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react";

interface AuditTrailViewerProps {
  cattleId: number;
}

export function AuditTrailViewer({ cattleId }: AuditTrailViewerProps) {
  const { data: auditTrail, isLoading } = trpc.cattle.auditTrail.useQuery({ cattleId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Loading cryptographically-verified event history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!auditTrail || auditTrail.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>Complete cryptographically-verified event history from Golden Record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No audit trail events found for this cattle.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Events will appear here once Kafka streaming is active.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'CATTLE_CREATED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OWNERSHIP_TRANSFER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TAG_CHANGED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VALUATION_UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MOVEMENT':
      case 'LOCATION_MOVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'HEALTH_CHECK':
      case 'HEALTH_RECORD':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'WEIGHT_RECORDED':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'SALE_INITIATED':
      case 'SALE_COMPLETED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'FRAUD_DETECTED':
      case 'THEFT_REPORTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Audit Trail
          <Badge variant="outline" className="ml-auto">
            {auditTrail.length} Events
          </Badge>
        </CardTitle>
        <CardDescription>
          Complete cryptographically-verified event history from Golden Record database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditTrail.map((event: any, index: number) => (
            <div
              key={event.event_id}
              className="relative border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              {/* Timeline connector */}
              {index < auditTrail.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-border -mb-4" />
              )}

              <div className="flex items-start gap-4">
                {/* Event icon */}
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    {event.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>

                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {formatEventType(event.event_type)}
                    </Badge>
                    
                    {event.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    
                    {event.block_hash && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Blockchain
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatTimestamp(event.occurred_at)}
                  </div>

                  {/* Event payload */}
                  {event.payload && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-md">
                      <div className="text-xs font-mono text-muted-foreground">
                        {Object.entries(event.payload).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-semibold">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event reference */}
                  <div className="mt-2 text-xs text-muted-foreground font-mono">
                    Event ID: {event.event_id}
                  </div>
                  
                  {event.block_hash && (
                    <div className="mt-1 text-xs text-muted-foreground font-mono">
                      Block Hash: {event.block_hash.substring(0, 16)}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>
              All events are cryptographically verified and stored in the Golden Record database.
              This ensures complete provenance and tamper-proof audit trails.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
