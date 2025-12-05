import { Link } from 'wouter';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function LandingPage() {
  const { data: summary } = trpc.portfolio.summary.useQuery({});
  const { data: activeClients } = trpc.clients.active.useQuery();

  const totalCattle = summary?.totalCattle || 100000;
  const totalClients = activeClients?.length || 25;
  const totalValue = summary?.totalValue || 35000000000;

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Hero Section with 3D Geometric Shapes */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        {/* Decorative 3D shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-plum-coral opacity-10 shape-blob blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-dark text-white mb-8">
              <Sparkles className="w-4 h-4 text-coral-400" />
              <span className="text-sm font-medium">Turing Protocol Verified</span>
            </div>
            
            <h1 className="font-serif font-bold text-6xl md:text-7xl mb-6 leading-tight text-white">
              Livestock.
              <br />
              <span className="text-gradient-purple-coral bg-gradient-to-r from-coral-300 to-cream-300 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>
            
            <p className="text-xl text-lavender-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              Cryptographically verified, biometrically secured, blockchain-audited proof of ownership for every animal's entire lifecycle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-plum-800 rounded-full font-semibold hover:bg-lavender-50 transition-all shadow-3d-coral">
                  View Dashboard
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Link>
              
              <Link href="/demo">
                <a className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-card-dark text-white rounded-full font-semibold hover:bg-white/20 transition-all">
                  <img src="/icattle-logo.png" alt="iCattle" className="w-5 h-5" />
                  Golden Record Demo
                </a>
              </Link>
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

      {/* Stats Section with Glassmorphism */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <StatCard
              number={totalCattle.toLocaleString('en-US')}
              label="Cattle Records"
              gradient="from-plum-500 to-plum-700"
            />
            <StatCard
              number={totalClients.toString()}
              label="Active Farms"
              gradient="from-coral-500 to-coral-700"
            />
            <StatCard
              number={`$${(totalValue / 100 / 1000000).toFixed(0)}M`}
              label="Portfolio Value"
              gradient="from-plum-600 to-coral-500"
            />
            <StatCard
              number="100%"
              label="Verified"
              gradient="from-coral-400 to-cream-500"
            />
          </div>
        </div>
      </section>

      {/* Features Section with 3D Cards */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-purple-pink opacity-5 shape-blob blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-serif font-bold text-5xl mb-6 text-plum-900">
              Everything you need.
              <br />
              <span className="text-gradient-purple-coral">Nothing you don't.</span>
            </h2>
            <p className="text-xl text-gray-600">
              Powerful tools designed for modern livestock management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              title="Golden Record"
              description="Complete lifecycle tracking with cryptographic verification and biometric identification."
              icon="🔐"
              gradient="from-plum-500 to-plum-700"
              href="/demo"
            />
            <FeatureCard
              title="Bank & Investor View"
              description="Real-time portfolio analytics and risk assessment for financial institutions."
              icon="📊"
              gradient="from-coral-500 to-coral-700"
              href="/bank"
            />
            <FeatureCard
              title="AI Intelligence"
              description="Predictive analytics, health forecasting, and automated compliance monitoring."
              icon="🤖"
              gradient="from-plum-600 to-coral-500"
              href="/forecast"
            />
            <FeatureCard
              title="Provenance Tracking"
              description="Immutable ownership history and transfer records on distributed ledger."
              icon="📜"
              gradient="from-lavender-600 to-plum-600"
              href="/provenance"
            />
            <FeatureCard
              title="Health Monitoring"
              description="Automated health checks, vaccination tracking, and veterinary integration."
              icon="🏥"
              gradient="from-coral-400 to-cream-500"
              href="/cattle"
            />
            <FeatureCard
              title="Financial Analytics"
              description="Portfolio optimization, market insights, and valuation forecasting."
              icon="💰"
              gradient="from-plum-500 to-coral-600"
              href="/financial"
            />
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="py-32 bg-gradient-plum-coral text-white relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white shape-circle blur-2xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-white shape-blob blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif font-bold text-5xl md:text-6xl mb-6">
            Ready to transform your
            <br />
            livestock management?
          </h2>
          <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Join the future of agricultural technology with iCattle's comprehensive platform.
          </p>
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-3 px-10 py-5 bg-white text-plum-800 rounded-full font-bold hover:bg-lavender-50 transition-all shadow-3d-coral text-lg">
              Explore the Platform
              <ArrowRight className="w-6 h-6" />
            </a>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ number, label, gradient }: {
  number: string;
  label: string;
  gradient: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-8 shadow-soft-lg hover:shadow-3d-purple transition-all group">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} mb-4 group-hover:scale-110 transition-transform`}></div>
      <div className="text-4xl font-bold text-plum-900 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

function FeatureCard({ title, description, icon, gradient, href }: {
  title: string;
  description: string;
  icon: string;
  gradient: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <a className="block bg-white rounded-3xl p-8 shadow-soft-md hover:shadow-3d-purple transition-all group border border-lavender-200">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-plum-900 mb-3 group-hover:text-gradient-purple-coral transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </a>
    </Link>
  );
}
