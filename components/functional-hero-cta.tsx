"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function FunctionalHeroCTA() {
  const router = useRouter();

  const handleStartExploring = () => {
    // Route to the search page or experiences page
    router.push("/search");
  };

  const handleLearnMore = () => {
    // Route to an about page or scroll to features section
    router.push("/experiences");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button 
        onClick={handleStartExploring}
        className="group bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-all duration-300 flex items-center justify-center"
      >
        Start Exploring
        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </button>
      <button 
        onClick={handleLearnMore}
        className="group bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white/30 hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
      >
        Browse Experiences
      </button>
    </div>
  );
}