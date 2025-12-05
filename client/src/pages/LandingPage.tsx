import { Link } from 'wouter';
import { ArrowRight, Shield, TrendingUp, Users, Database } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function LandingPage() {
  const { data: summary } = trpc.portfolio.summary.useQuery({});
  const { data: activeClients } = trpc.clients.active.useQuery();

  const totalCattle = summary?.totalCattle || 100000;
  const totalClients = activeClients?.length || 25;
  const totalValue = summary?.totalValue || 35000000000; // $350M in cents

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-lavender-50 to-mauve-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple-coral opacity-5" />
        
        <div className="container mx-auto px-6 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif font-light text-6xl md:text-7xl mb-6 leading-tight">
              <span className="text-mauve-600">Livestock</span>
              <br />
              <span className="text-gray-900">management.</span>
              <br />
              <span className="text-mauve-600">Simplified.</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Cryptographically verified, biometrically secured, blockchain-audited proof of ownership for every animal's entire lifecycle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-mauve-600 text-white rounded-full font-medium hover:bg-mauve-700 transition-all shadow-soft-lg hover:shadow-soft-xl">
                  View Dashboard
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Link>
              
              <Link href="/golden-record">
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-mauve-600 rounded-full font-medium hover:bg-lavender-50 transition-all shadow-soft-md border border-mauve-200">
                  <Shield className="w-5 h-5" />
                  Golden Record Demo
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard
              number={totalCattle.toLocaleString()}
              label="Cattle Records"
              icon={<Database className="w-8 h-8" />}
              gradient="from-mauve-400 to-mauve-600"
            />
            <StatCard
              number={totalClients.toString()}
              label="Active Farms"
              icon={<Users className="w-8 h-8" />}
              gradient="from-coral-400 to-coral-600"
            />
            <StatCard
              number={`$${(totalValue / 100 / 1000000).toFixed(0)}M`}
              label="Portfolio Value"
              icon={<TrendingUp className="w-8 h-8" />}
              gradient="from-mauve-500 to-coral-500"
            />
            <StatCard
              number="100%"
              label="Verified"
              icon={<Shield className="w-8 h-8" />}
              gradient="from-lavender-500 to-mauve-500"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-lavender-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-serif font-light text-5xl mb-6 text-gray-900 leading-tight">
              <span className="text-mauve-600">Raise</span> capital.
              <br />
              <span className="text-mauve-600">Attract</span> investors.
              <br />
              <span className="text-mauve-600">Build</span> smarter.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              title="Golden Record"
              description="Complete lifecycle tracking with cryptographic verification and biometric identification."
              icon="🔐"
              href="/golden-record"
            />
            <FeatureCard
              title="Bank & Investor View"
              description="Real-time portfolio analytics and risk assessment for financial institutions."
              icon="📊"
              href="/bank-view"
            />
            <FeatureCard
              title="AI Intelligence"
              description="Predictive analytics, health forecasting, and automated compliance monitoring."
              icon="🤖"
              href="/price-forecast"
            />
            <FeatureCard
              title="Provenance Tracking"
              description="Immutable ownership history and transfer records on distributed ledger."
              icon="📜"
              href="/provenance"
            />
            <FeatureCard
              title="Health Monitoring"
              description="Automated health checks, vaccination tracking, and veterinary integration."
              icon="🏥"
              href="/cattle"
            />
            <FeatureCard
              title="Financial Analytics"
              description="Portfolio optimization, market insights, and valuation forecasting."
              icon="💰"
              href="/financial"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-mauve-600 to-coral-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif font-light text-5xl mb-6">
            Ready to transform your livestock management?
          </h2>
          <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Join the future of agricultural technology with iCattle's comprehensive platform.
          </p>
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-2 px-10 py-5 bg-white text-mauve-600 rounded-full font-semibold hover:bg-cream-50 transition-all shadow-soft-xl text-lg">
              Explore the Platform
              <ArrowRight className="w-6 h-6" />
            </a>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ number, label, icon, gradient }: {
  number: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-soft-md hover:shadow-soft-lg transition-all">
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4`}>
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

function FeatureCard({ title, description, icon, href }: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <a className="bg-white rounded-2xl p-8 shadow-soft-md hover:shadow-soft-lg transition-all block">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </a>
    </Link>
  );
}
