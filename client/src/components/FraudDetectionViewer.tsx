/**
 * FRAUD DETECTION VIEWER
 * 
 * Displays real-time fraud detection analysis with Turing Protocol enforcement.
 * Shows fraud alerts, risk score, and protocol compliance status.
 */

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  MapPin,
  DollarSign,
  Users,
  Tag
} from 'lucide-react';

interface FraudDetectionViewerProps {
  cattleId: number;
}

export function FraudDetectionViewer({ cattleId }: FraudDetectionViewerProps) {
  const { data, isLoading, error } = trpc.fraud.analyze.useQuery({ cattleId });

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
          Failed to analyze for fraud: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const getFraudTypeIcon = (type: string) => {
    switch (type) {
      case 'TAG_SWAP':
        return <Tag className="h-4 w-4" />;
      case 'RAPID_MOVEMENT':
        return <MapPin className="h-4 w-4" />;
      case 'PRICE_ANOMALY':
        return <DollarSign className="h-4 w-4" />;
      case 'OWNERSHIP_CHURN':
        return <Users className="h-4 w-4" />;
      case 'LOCATION_ANOMALY':
        return <MapPin className="h-4 w-4" />;
      case 'PROTOCOL_VIOLATION':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-orange-600';
    if (score >= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'HIGH RISK';
    if (score >= 40) return 'MEDIUM RISK';
    if (score >= 20) return 'LOW RISK';
    return 'MINIMAL RISK';
  };

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Fraud Risk Assessment
            </span>
            <Badge variant={data.risk_score >= 70 ? 'destructive' : data.risk_score >= 40 ? 'secondary' : 'default'}>
              {getRiskLabel(data.risk_score)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Based on {data.analyzed_events} events analyzed with Turing Protocol enforcement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getRiskColor(data.risk_score)}`}>
                {data.risk_score}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Risk Score (0-100)</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.alerts.length}</div>
              <div className="text-xs text-muted-foreground">Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.analyzed_events}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {data.protocol_compliant ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 inline" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 inline" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">Protocol</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Compliance */}
      {!data.protocol_compliant && data.protocol_violations.length > 0 && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Critical Protocol Violations Detected</AlertTitle>
          <AlertDescription>
            This cattle has {data.protocol_violations.length} protocol violation(s). 
            Event chain integrity is compromised. Do not use for lending decisions.
          </AlertDescription>
        </Alert>
      )}

      {/* Fraud Alerts */}
      {data.alerts.length === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>No Fraud Detected</AlertTitle>
          <AlertDescription>
            All analyzed events passed fraud detection checks. This cattle shows no suspicious patterns.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fraud Alerts ({data.alerts.length})</CardTitle>
            <CardDescription>
              Suspicious patterns detected in event history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.map((alert) => (
              <Alert
                key={alert.alert_id}
                variant={alert.severity === 'CRITICAL' ? 'destructive' : 'default'}
                className="relative"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getFraudTypeIcon(alert.fraud_type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {alert.confidence_score}% confidence
                        </Badge>
                        <Badge variant={
                          alert.severity === 'CRITICAL' ? 'destructive' :
                          alert.severity === 'HIGH' ? 'secondary' :
                          alert.severity === 'MEDIUM' ? 'outline' : 'default'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    <AlertDescription className="text-sm">
                      {alert.description}
                    </AlertDescription>
                    
                    {/* Evidence Details */}
                    {alert.evidence && (
                      <details className="text-xs text-muted-foreground mt-2">
                        <summary className="cursor-pointer hover:text-foreground">
                          View Evidence
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(alert.evidence, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Detected: {new Date(alert.detected_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Analysis Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Analysis Metadata</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Analysis Timestamp:</span>
            <span className="font-medium">{new Date(data.analysis_timestamp).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Events Analyzed:</span>
            <span className="font-medium">{data.analyzed_events}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol Compliant:</span>
            <span className="font-medium">
              {data.protocol_compliant ? (
                <span className="text-green-600">Yes</span>
              ) : (
                <span className="text-red-600">No</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol Violations:</span>
            <span className="font-medium">{data.protocol_violations.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
