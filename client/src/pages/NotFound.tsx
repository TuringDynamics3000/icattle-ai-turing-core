import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-plum-coral relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-20 right-20 w-64 h-64 bg-white shape-circle blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white shape-blob blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center px-6">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <h1 className="font-serif text-8xl font-bold text-white mb-4">404</h1>

        <h2 className="text-3xl font-serif font-semibold text-white mb-4">
          Page Not Found
        </h2>

        <p className="text-xl text-lavender-100 mb-12 max-w-md mx-auto leading-relaxed">
          Sorry, the page you are looking for doesn't exist.
          <br />
          It may have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-plum-800 rounded-full font-semibold hover:bg-lavender-50 transition-all shadow-3d-coral"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Button>
          
          <Button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-8 py-4 glass-card-dark text-white rounded-full font-semibold hover:bg-white/20 transition-all border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
