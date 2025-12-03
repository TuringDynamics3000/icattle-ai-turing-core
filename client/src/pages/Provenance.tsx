/**
 * PROVENANCE DASHBOARD
 * 
 * Shows confidence scores, verification status, and fraud alerts
 * for cattle in the Golden Record (Turing Protocol)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Search, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function Provenance() {
  const [searchTag, setSearchTag] = useState('');
  const { data: cattle, isLoading } = trpc.cattle.list.useQuery();

  // Filter cattle by search
  const filteredCattle = cattle?.filter(c => 
    searchTag === '' || c.nlisId?.toLowerCase().includes(searchTag.toLowerCase()) || c.id.toString().includes(searchTag)
  ) || [];

  // Calculate provenance statistics
  const stats = {
    total: cattle?.length || 0,
    highConfidence: cattle?.filter(c => getConfidenceScore(c) >= 80).length || 0,
    mediumConfidence: cattle?.filter(c => {
      const score = getConfidenceScore(c);
      return score >= 50 && score < 80;
    }).length || 0,
    lowConfidence: cattle?.filter(c => getConfidenceScore(c) < 50).length || 0,
    suspicious: cattle?.filter(c => getSuspiciousFlags(c).length > 0).length || 0,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Provenance Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Turing Protocol Golden Record - Confidence Scores & Fraud Detection
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cattle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">
              High Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
            <p className="text-xs text-muted-foreground mt-1">≥80% verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Medium Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.mediumConfidence}</div>
            <p className="text-xs text-muted-foreground mt-1">50-79% verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">
              Low Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowConfidence}</div>
            <p className="text-xs text-muted-foreground mt-1">&lt;50% verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">
              Suspicious
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspicious}</div>
            <p className="text-xs text-muted-foreground mt-1">Fraud alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Cattle</CardTitle>
          <CardDescription>Filter by NLIS tag or iCattle ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tag..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTag('')}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cattle List */}
      <div className="space-y-4">
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading cattle data...
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredCattle.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No cattle found matching your search.
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredCattle.map((animal) => {
          const confidenceScore = getConfidenceScore(animal);
          const verificationStatus = getVerificationStatus(animal);
          const suspiciousFlags = getSuspiciousFlags(animal);

          return (
            <Card key={animal.id} className={suspiciousFlags.length > 0 ? 'border-red-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <span>iCattle #{animal.id}</span>
                      {animal.nlisId && (
                        <Badge variant="outline">NLIS: {animal.nlisId}</Badge>
                      )}
                      {getConfidenceBadge(confidenceScore)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {animal.breed} {animal.sex} • {animal.currentWeight}kg
                      {animal.dateOfBirth && ` • Born ${new Date(animal.dateOfBirth).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{confidenceScore}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verification Status */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Verification Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {verificationStatus.map((status) => (
                      <div key={status.type} className="flex items-center gap-2 text-sm">
                        {status.verified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={status.verified ? 'text-green-600' : 'text-muted-foreground'}>
                          {status.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suspicious Flags */}
                {suspiciousFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 mb-2">Fraud Alerts</h4>
                        <ul className="space-y-1">
                          {suspiciousFlags.map((flag, idx) => (
                            <li key={idx} className="text-sm text-red-800">
                              • {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Audit Trail
                  </Button>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate confidence score based on available verification data
 * In production, this would come from the Turing Protocol event store
 */
function getConfidenceScore(cattle: any): number {
  let score = 0;
  
  // Base score for having iCattle ID (Golden Record)
  score += 40;
  
  // NLIS tag verification
  if (cattle.tag) score += 20;
  
  // Photo verification (simulated - would check event store)
  if (cattle.id % 3 !== 0) score += 15;
  
  // GPS location tracking (simulated)
  if (cattle.id % 2 === 0) score += 15;
  
  // DNA/biometric verification (simulated - premium feature)
  if (cattle.breed === 'Wagyu' || cattle.breed === 'Angus') score += 10;
  
  return Math.min(score, 100);
}

/**
 * Get verification status for each data source
 */
function getVerificationStatus(cattle: any) {
  return [
    { type: 'NLIS', verified: !!cattle.nlisId },
    { type: 'Photo', verified: cattle.id % 3 !== 0 },
    { type: 'GPS', verified: cattle.id % 2 === 0 },
    { type: 'DNA', verified: cattle.breed === 'Wagyu' || cattle.breed === 'Angus' },
  ];
}

/**
 * Detect suspicious flags based on Turing Protocol fraud detection
 */
function getSuspiciousFlags(cattle: any): string[] {
  const flags: string[] = [];
  
  // Tag swap detection (simulated)
  if (cattle.id % 50 === 0) {
    flags.push('Possible tag swap detected - NLIS tag changed recently without authorization');
  }
  
  // Rapid movement detection (simulated)
  if (cattle.id % 75 === 0) {
    flags.push('Rapid location changes detected - moved >500km in 24 hours');
  }
  
  // Price anomaly detection (simulated)
  if (cattle.currentValuation && cattle.currentValuation > 5000) {
    const expectedValue = cattle.currentWeight * 4.5; // Rough estimate
    if (cattle.currentValuation > expectedValue * 2) {
      flags.push('Valuation anomaly - price significantly above market rate');
    }
  }
  
  return flags;
}

/**
 * Get confidence badge color
 */
function getConfidenceBadge(score: number) {
  if (score >= 80) {
    return <Badge className="bg-green-600">High Confidence</Badge>;
  } else if (score >= 50) {
    return <Badge className="bg-yellow-600">Medium Confidence</Badge>;
  } else {
    return <Badge className="bg-orange-600">Low Confidence</Badge>;
  }
}
