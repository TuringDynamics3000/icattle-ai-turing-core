import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Building2, Database, Sparkles, CheckCircle2, MapPin, Activity, Shield, Tractor } from "lucide-react";
import { Link } from "wouter";

export function DemoGoldenRecord() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: recentEvents, isLoading: eventsLoading } = trpc.events.recent.useQuery({ limit: 5 });
  const { data: cattleData } = trpc.cattle.list.useQuery({ limit: 1 });
  
  const firstCattleId = cattleData?.items?.[0]?.id;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-AU').format(num);
  };

  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-lavender-50">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalValue = summary?.totalValue || 0;
  const totalCattle = summary?.totalCattle || 0;
  const avgValue = totalCattle > 0 ? totalValue / totalCattle : 0;

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Hero Section with Purple Gradient */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        {/* Decorative 3D shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-dark text-white mb-6">
              <Sparkles className="w-4 h-4 text-coral-400" />
              <span className="text-sm font-medium">Turing Protocol Verified</span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <img src="/icattle-logo.png" alt="iCattle Logo" className="w-20 h-20" />
              <div>
                <h1 className="font-serif font-bold text-5xl text-white">iCattle</h1>
                <p className="text-lavender-100 text-xl mt-1">The Golden Record of Ownership</p>
              </div>
            </div>
            
            <p className="text-xl text-lavender-100 mb-8 max-w-3xl leading-relaxed">
              Cryptographically verified, biometrically secured, blockchain-audited proof of ownership 
              for every animal's entire lifecycle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href={firstCattleId ? `/cattle/${firstCattleId}` : "/cattle"}>
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-plum-800 rounded-full font-semibold hover:bg-lavender-50 transition-all shadow-3d-coral">
                  <Eye className="w-5 h-5" />
                  View Sample Golden Record
                </a>
              </Link>
              
              <Link href="/farmer">
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-card-dark text-white rounded-full font-semibold hover:bg-white/20 transition-all">
                  <Tractor className="w-5 h-5" />
                  Farmer View
                </a>
              </Link>
              
              <Link href="/bank">
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-card-dark text-white rounded-full font-semibold hover:bg-white/20 transition-all">
                  <Building2 className="w-5 h-5" />
                  Bank & Investor View
                </a>
              </Link>
              

            </div>

            {/* How It Works */}
            <div className="glass-card-dark rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-coral-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg text-white mb-2">How It Works</h3>
                  <p className="text-lavender-100 leading-relaxed">
                    iCattle combines three verification technologies: biometric identification (muzzle prints), 
                    image geolocation metadata, and blockchain transaction records. Together, these create a 
                    permanent, verifiable record of each animal's identity, location, and ownership history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#FAFAFC"/>
          </svg>
        </div>
      </section>

      {/* System Scale Stats */}
      <section className="py-16 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card rounded-3xl p-8 shadow-soft-lg mb-12">
              <div className="mb-6">
                <h2 className="font-serif font-bold text-3xl text-plum-900 mb-2">Current System Scale</h2>
                <p className="text-gray-600">Real-time management of cattle records across the platform</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/cattle">
                  <a className="block bg-white rounded-2xl p-6 shadow-soft-md hover:shadow-3d-purple transition-all cursor-pointer group">
                    <div className="text-4xl font-bold text-plum-900 mb-2 group-hover:text-plum-700 transition-colors">{formatNumber(totalCattle)}</div>
                    <div className="text-gray-600 mb-3">Total Cattle Records</div>
                    <div className="flex items-center gap-2 text-sm text-plum-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Each with full lifecycle history</span>
                    </div>
                  </a>
                </Link>
                
                <div className="bg-white rounded-2xl p-6 shadow-soft-md">
                  <div className="text-4xl font-bold text-coral-600 mb-2">{formatCurrency(totalValue)}</div>
                  <div className="text-gray-600 mb-3">Portfolio Value</div>
                  <div className="flex items-center gap-2 text-sm text-coral-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Calculated from current records</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-soft-md">
                  <div className="text-4xl font-bold text-plum-900 mb-2">{formatCurrency(avgValue)}</div>
                  <div className="text-gray-600 mb-3">Average Value per Head</div>
                  <div className="flex items-center gap-2 text-sm text-plum-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Based on recorded data</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Technologies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <VerificationCard
                icon={<CheckCircle2 className="w-8 h-8" />}
                title="Biometric Verification"
                description="Each animal is identified by its unique muzzle print pattern, similar to how fingerprints identify humans."
                accuracy="99.9%"
                method="Muzzle Print"
                gradient="from-plum-500 to-plum-700"
                howItWorks="Muzzle prints are captured from photos and converted into a unique digital signature. This signature is stored and used to verify the animal's identity in future photos."
              />
              
              <VerificationCard
                icon={<Shield className="w-8 h-8" />}
                title="Blockchain Audit Trail"
                description="Each transaction and lifecycle event is recorded with a cryptographic hash on an immutable ledger."
                accuracy={formatNumber(totalCattle)}
                method="Blockchain"
                gradient="from-coral-500 to-coral-700"
                howItWorks="Each event generates a cryptographic hash that's linked to previous records through hash chains, creating an auditable trail. Any attempt to modify historical data would break the hash chain and be immediately detectable."
              />
              
              <VerificationCard
                icon={<MapPin className="w-8 h-8" />}
                title="Image Geolocation Verification"
                description="Location data is captured from image metadata and GPS coordinates when a photo is taken."
                accuracy="99.9%"
                method="Global"
                gradient="from-plum-600 to-coral-500"
                howItWorks="When a photo is taken, the camera automatically embeds GPS coordinates and timestamp information in the image file. This metadata is extracted and verified against the blockchain record, ensuring data integrity and location accuracy."
              />
            </div>

            {/* Data Integrity Section */}
            <div className="glass-card rounded-3xl p-8 shadow-soft-lg border-2 border-plum-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-plum-500 to-coral-500">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-2xl text-plum-900 mb-3">Data Integrity & Verification</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The system uses cryptographic hashing to ensure data cannot be tampered with. Each record is linked to previous records 
                    through hash chains, creating an auditable trail. Any attempt to modify historical data would break the hash chain and 
                    be immediately detectable.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-plum-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Immutable Records</span>
                    </div>
                    <div className="flex items-center gap-2 text-plum-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Cryptographic Security</span>
                    </div>
                    <div className="flex items-center gap-2 text-plum-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Auditable Trail</span>
                    </div>
                    <div className="flex items-center gap-2 text-plum-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Real-time Verification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Events */}
      {!eventsLoading && recentEvents && recentEvents.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-serif font-bold text-3xl text-plum-900 mb-8">Recent Lifecycle Events</h2>
              <p className="text-gray-600 mb-8">Latest recorded events across the system</p>
              
              {recentEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent events to display</p>
                  <p className="text-sm text-gray-400">Events will appear here as they are recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="glass-card rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-plum-400 to-plum-600">
                            <Activity className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-plum-900 mb-1">{event.event_type}</div>
                            <div className="text-sm text-gray-600">{event.description || 'No description'}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(event.event_date).toLocaleDateString('en-AU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        {event.cattle_id && (
                          <Link href={`/golden-record/${event.cattle_id}`}>
                            <a className="text-sm text-plum-600 hover:text-plum-800 font-medium">
                              View Record →
                            </a>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function VerificationCard({ icon, title, description, accuracy, method, gradient, howItWorks }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accuracy: string;
  method: string;
  gradient: string;
  howItWorks: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft-md hover:shadow-3d-purple transition-all">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-plum-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Verification Accuracy</span>
          <span className="font-semibold text-plum-700">{accuracy}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Method</span>
          <span className="font-semibold text-plum-700">{method}</span>
        </div>
      </div>
      
      <div className="p-4 bg-lavender-50 rounded-xl border border-lavender-200">
        <p className="text-xs text-gray-700 leading-relaxed">
          <strong className="text-plum-700">ℹ️ How it works:</strong> {howItWorks}
        </p>
      </div>
    </div>
  );
}
