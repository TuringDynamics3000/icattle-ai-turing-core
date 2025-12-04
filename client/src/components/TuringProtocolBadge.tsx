import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Fingerprint, MapPin, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TuringProtocolBadgeProps {
  cattleId: number;
  biometricVerified: boolean;
  blockchainVerified: boolean;
  gpsVerified: boolean;
  blockchainHash?: string;
  verificationTimestamp?: Date;
  confidenceScore?: number;
  compact?: boolean;
}

export function TuringProtocolBadge({
  cattleId,
  biometricVerified,
  blockchainVerified,
  gpsVerified,
  blockchainHash,
  verificationTimestamp,
  confidenceScore = 99.9,
  compact = false,
}: TuringProtocolBadgeProps) {
  // Calculate overall verification status
  const allVerified = biometricVerified && blockchainVerified && gpsVerified;
  const partialVerified = biometricVerified || blockchainVerified || gpsVerified;
  
  // Generate mock hash if not provided
  const hash = blockchainHash || `0x${Math.abs(cattleId * 12345).toString(16).padStart(64, '0').slice(0, 64)}`;
  const shortHash = `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  
  const timestamp = verificationTimestamp || new Date();
  const formattedTime = timestamp.toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md">
        <img src="/turing-dynamics-logo.png" alt="Turing Dynamics" className="h-5 w-5 object-contain" />
        <span className="text-sm font-semibold">Turing Protocol Verified</span>
        {allVerified && <CheckCircle2 className="h-4 w-4" />}
      </div>
    );
  }

  return (
    <Card className={cn(
      "border-2 overflow-hidden relative",
      allVerified ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50" :
      partialVerified ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50" :
      "border-gray-300 bg-gray-50"
    )}>
      {/* Animated Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src="/icattle-logo-holographic.png" 
            alt="" 
            className="w-48 h-48 object-contain opacity-[0.08] animate-float"
            style={{
              filter: 'blur(1px)',
              animation: 'float 6s ease-in-out infinite, pulse 4s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/turing-dynamics-logo.png" 
                alt="Turing Dynamics" 
                className="h-12 w-12 object-contain"
              />
              {allVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1 shadow-lg animate-pulse">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Turing Protocol</h3>
              <p className="text-sm text-gray-600">Golden Record Verification</p>
            </div>
          </div>
          <Badge 
            variant={allVerified ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold shadow-md",
              allVerified && "bg-green-600 hover:bg-green-700 animate-pulse"
            )}
          >
            {allVerified ? "VERIFIED" : partialVerified ? "PARTIAL" : "PENDING"}
          </Badge>
        </div>

        {/* Verification Pillars */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Biometric */}
          <div className={cn(
            "p-4 rounded-lg border-2 transition-all transform hover:scale-105 hover:shadow-lg",
            biometricVerified 
              ? "bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md" 
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Fingerprint className={cn(
                "h-5 w-5",
                biometricVerified ? "text-green-600" : "text-gray-400"
              )} />
              {biometricVerified && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </div>
            <div className="text-sm font-bold text-gray-900">Biometric</div>
            <div className={cn(
              "text-xs mt-1 font-semibold",
              biometricVerified ? "text-green-700" : "text-gray-500"
            )}>
              {biometricVerified ? "Verified" : "Pending"}
            </div>
          </div>

          {/* Blockchain */}
          <div className={cn(
            "p-4 rounded-lg border-2 transition-all transform hover:scale-105 hover:shadow-lg",
            blockchainVerified 
              ? "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400 shadow-md" 
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className={cn(
                "h-5 w-5",
                blockchainVerified ? "text-purple-600" : "text-gray-400"
              )} />
              {blockchainVerified && <CheckCircle2 className="h-4 w-4 text-purple-600" />}
            </div>
            <div className="text-sm font-bold text-gray-900">Blockchain</div>
            <div className={cn(
              "text-xs mt-1 font-semibold",
              blockchainVerified ? "text-purple-700" : "text-gray-500"
            )}>
              {blockchainVerified ? "Verified" : "Pending"}
            </div>
          </div>

          {/* GPS */}
          <div className={cn(
            "p-4 rounded-lg border-2 transition-all transform hover:scale-105 hover:shadow-lg",
            gpsVerified 
              ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400 shadow-md" 
              : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className={cn(
                "h-5 w-5",
                gpsVerified ? "text-orange-600" : "text-gray-400"
              )} />
              {gpsVerified && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
            </div>
            <div className="text-sm font-bold text-gray-900">Geolocation</div>
            <div className={cn(
              "text-xs mt-1 font-semibold",
              gpsVerified ? "text-orange-700" : "text-gray-500"
            )}>
              {gpsVerified ? "Verified" : "Pending"}
            </div>
          </div>
        </div>

        {/* Cryptographic Details */}
        {allVerified && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {/* Confidence Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Confidence Score</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-full shadow-lg transition-all duration-1000"
                    style={{ 
                      width: `${confidenceScore}%`,
                      animation: 'shimmer 2s ease-in-out infinite'
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-green-700 min-w-[3rem] text-right">{confidenceScore}%</span>
              </div>
            </div>

            {/* Blockchain Hash */}
            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">Blockchain Hash</span>
              <div className="px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700">
                <code className="text-sm text-green-400 font-mono break-all tracking-wide">{shortHash}</code>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-gray-600 font-medium">Verified</span>
              <span className="font-semibold text-gray-900">{formattedTime}</span>
            </div>
          </div>
        )}

        {/* Status Message */}
        {!allVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
            <p className="text-xs text-yellow-800">
              {partialVerified 
                ? "Partial verification complete. Additional verification methods pending."
                : "Verification in progress. Please complete all verification steps."}
            </p>
          </div>
        )}
      </CardContent>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.08;
          }
          50% {
            opacity: 0.12;
          }
        }
        
        @keyframes shimmer {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }
      `}</style>
    </Card>
  );
}
