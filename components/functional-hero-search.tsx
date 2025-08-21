"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, MapPin, Plane, Star, Globe } from "lucide-react";

interface SearchData {
  from: string;
  to: string;
  departure: string;
  layoverMinHours?: number;
  searchType: "flights" | "experiences" | "packages";
}

export default function FunctionalHeroSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("flights");
  const [searchData, setSearchData] = useState<SearchData>({
    from: "",
    to: "",
    departure: "",
    searchType: "flights"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof SearchData, value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchData(prev => ({
      ...prev,
      searchType: tab as "flights" | "experiences" | "packages"
    }));
  };

  const handleSearch = async () => {
    if (!searchData.from || !searchData.to || !searchData.departure) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      // Build search query parameters
      const searchParams = new URLSearchParams({
        from: searchData.from,
        to: searchData.to,
        departure: searchData.departure,
        type: searchData.searchType
      });

      // Add layover filter if specified
      if (searchData.layoverMinHours) {
        searchParams.append('layoverMinHours', searchData.layoverMinHours.toString());
      }

      // Route to search page with parameters
      router.push(`/search?${searchParams.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      alert("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFilter = (filterType: string) => {
    switch (filterType) {
      case "8hour":
        setSearchData(prev => ({ ...prev, layoverMinHours: 8 }));
        break;
      case "deals":
        router.push("/experiences?filter=deals");
        break;
      case "premium":
        router.push("/experiences?filter=premium");
        break;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      {/* Search Header */}
      <div className="bg-slate-50 p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Find Layover Adventures</h3>
        <p className="text-slate-600 text-sm">Search flights with extended stopovers</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white px-6">
        <div className="flex">
          <button
            onClick={() => handleTabChange("flights")}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "flights"
                ? "text-slate-900 border-slate-900"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <Plane className="h-4 w-4 mr-2" />
            Flights
          </button>
          <button
            onClick={() => handleTabChange("experiences")}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "experiences"
                ? "text-slate-900 border-slate-900"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <Star className="h-4 w-4 mr-2" />
            Experiences
          </button>
          <button
            onClick={() => handleTabChange("packages")}
            className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "packages"
                ? "text-slate-900 border-slate-900"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <Globe className="h-4 w-4 mr-2" />
            Packages
          </button>
        </div>
      </div>

      {/* Search Form */}
      <div className="p-6 bg-white">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Origin city or airport"
                  value={searchData.from}
                  onChange={(e) => handleInputChange("from", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Destination city or airport"
                  value={searchData.to}
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Departure</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={searchData.departure}
                onChange={(e) => handleInputChange("departure", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all text-sm"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? "Searching..." : "Search Flights"}
          </button>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleQuickFilter("8hour")}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              8+ Hour Layovers
            </button>
            <button 
              onClick={() => handleQuickFilter("deals")}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Best Deals
            </button>
            <button 
              onClick={() => handleQuickFilter("premium")}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}