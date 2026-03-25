import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MessageSquare, Twitter, Layout } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1d9bf0]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#ff492c]/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-[#ff4500]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl w-full z-10 text-center">
        <div className="mb-12">
          <div className="inline-block bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            Clarix Social Proof Simulation
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Clarix: The AI Sales <br /> Assistant for Modern Teams
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Streamline your outbound operations with intelligent automation. Clarix helps teams manage lead generation and CRM data with precision and ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PortalCard 
            to="/g2"
            title="G2 Reviews"
            description="Verified software reviews and ratings from the community."
            icon={<Layout className="text-[#ff492c]" size={32} />}
            brandColor="hover:border-[#ff492c]/50"
            brandBg="bg-[#ff492c]/5"
            logoText="G2"
            logoColor="text-[#ff492c]"
          />
          <PortalCard 
            to="/reddit"
            title="Reddit Discussion"
            description="Real-time community discussions and user feedback."
            icon={<MessageSquare className="text-[#ff4500]" size={32} />}
            brandColor="hover:border-[#ff4500]/50"
            brandBg="bg-[#ff4500]/5"
            logoText="reddit"
            logoColor="text-[#ff4500]"
          />
          <PortalCard 
            to="/twitter"
            title="Twitter Thread"
            description="Viral threads and evangelist posts from industry leaders."
            icon={<Twitter className="text-[#1d9bf0]" size={32} />}
            brandColor="hover:border-[#1d9bf0]/50"
            brandBg="bg-[#1d9bf0]/5"
            logoText="𝕏"
            logoColor="text-white"
          />
        </div>

        <footer className="mt-20 text-gray-500 text-sm">
          © 2026 Clarix Simulation Tool. For demonstration purposes only.
        </footer>
      </div>
    </div>
  );
};

const PortalCard = ({ to, title, description, icon, brandColor, brandBg, logoText, logoColor }: any) => (
  <Link 
    to={to} 
    className={`group relative flex flex-col p-8 bg-white/5 border border-white/10 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 ${brandColor}`}
  >
    <div className={`w-14 h-14 ${brandBg} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div className="flex-1 text-left">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <ExternalLink size={16} className="text-gray-500 group-hover:text-white transition-colors" />
      </div>
      <p className="text-gray-400 text-sm leading-relaxed mb-6">
        {description}
      </p>
      <div className={`text-2xl font-black italic tracking-tighter ${logoColor}`}>
        {logoText}
      </div>
    </div>
  </Link>
);

export default LandingPage;
