import React from 'react';
import { 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Share, 
  MoreHorizontal, 
  ArrowLeft, 
  CheckCircle2,
  Search,
  Home,
  Bell,
  Mail,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TwitterPage = () => {
  const tweets = [
    {
      id: 1,
      content: "Clarix helped our team increase conversions in 2 weeks. The automation feature alone is worth it. 🚀 #SalesTech #Clarix",
      time: "10:24 AM · Mar 24, 2026",
      stats: { replies: 0, retweets: 1, likes: 3 }
    },
    {
      id: 2,
      content: "Clarix helped our team boost lead quality in 3 days. The CRM integration alone is worth it. 📈 #SalesEfficiency",
      time: "10:26 AM · Mar 24, 2026",
      stats: { replies: 1, retweets: 0, likes: 2 }
    },
    {
      id: 3,
      content: "Clarix helped our team scale outbound in 1 week. The data enrichment alone is worth it. 💎 #GrowthHacking",
      time: "10:28 AM · Mar 24, 2026",
      stats: { replies: 0, retweets: 0, likes: 4 }
    },
    {
      id: 4,
      content: "Clarix helped our team improve efficiency in 5 days. The reporting feature alone is worth it. 🔥 #SalesOps",
      time: "10:30 AM · Mar 24, 2026",
      stats: { replies: 0, retweets: 1, likes: 2 }
    },
    {
      id: 5,
      content: "Clarix helped our team save time in 48 hours. The sequence builder alone is worth it. 🙌 #Automation",
      time: "10:32 AM · Mar 24, 2026",
      stats: { replies: 1, retweets: 0, likes: 5 }
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <div className="max-w-[1200px] mx-auto flex">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col w-[275px] sticky top-0 h-screen px-4 py-2 border-r border-gray-100">
          <div className="p-3 mb-2">
            <Link to="/" className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold">𝕏</Link>
          </div>
          <nav className="flex flex-col gap-1">
            <NavItem icon={<Home size={24} />} label="Home" active />
            <NavItem icon={<Search size={24} />} label="Explore" />
            <NavItem icon={<Bell size={24} />} label="Notifications" />
            <NavItem icon={<Mail size={24} />} label="Messages" />
            <NavItem icon={<User size={24} />} label="Profile" />
            <NavItem icon={<MoreHorizontal size={24} />} label="More" />
          </nav>
          <button className="mt-4 bg-[#1d9bf0] text-white font-bold py-3 rounded-full w-full hover:bg-[#1a8cd8] transition-colors">
            Post
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-[600px] border-r border-gray-100 min-h-screen">
          <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-3 flex items-center gap-8 border-b border-gray-100">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Thread</h1>
            </div>
          </header>

          {/* Account Profile Section (Mini) */}
          <div className="p-4 flex gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
              <img src="https://picsum.photos/seed/evangelist/100/100" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold hover:underline cursor-pointer">Clarix Evangelist</span>
                    <CheckCircle2 size={16} className="text-[#1d9bf0] fill-[#1d9bf0] text-white" />
                  </div>
                  <div className="text-gray-500">@clarix_evangelist</div>
                </div>
                <button className="bg-black text-white font-bold px-4 py-1.5 rounded-full text-sm">
                  Follow
                </button>
              </div>
              <div className="mt-3 text-[15px]">
                Passionate about sales efficiency and modern tech stacks. 🚀 | 12 Followers
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100"></div>

          {/* Tweets */}
          {tweets.map((tweet, index) => (
            <div key={tweet.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                    <img src="https://picsum.photos/seed/evangelist/100/100" alt="Avatar" referrerPolicy="no-referrer" />
                  </div>
                  {index < tweets.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-1 text-[15px]">
                    <span className="font-bold hover:underline">Clarix Evangelist</span>
                    <span className="text-gray-500">@clarix_evangelist · 1d</span>
                  </div>
                  <div className="mt-1 text-[15px] leading-normal whitespace-pre-wrap">
                    {tweet.content}
                  </div>
                  <div className="mt-3 flex justify-between text-gray-500 max-w-md">
                    <div className="flex items-center gap-2 hover:text-[#1d9bf0] group">
                      <div className="p-2 group-hover:bg-[#1d9bf0]/10 rounded-full transition-colors">
                        <MessageCircle size={18} />
                      </div>
                      <span className="text-sm">{tweet.stats.replies || ""}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-[#00ba7c] group">
                      <div className="p-2 group-hover:bg-[#00ba7c]/10 rounded-full transition-colors">
                        <Repeat2 size={18} />
                      </div>
                      <span className="text-sm">{tweet.stats.retweets || ""}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-[#f91880] group">
                      <div className="p-2 group-hover:bg-[#f91880]/10 rounded-full transition-colors">
                        <Heart size={18} />
                      </div>
                      <span className="text-sm">{tweet.stats.likes || ""}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-[#1d9bf0] group">
                      <div className="p-2 group-hover:bg-[#1d9bf0]/10 rounded-full transition-colors">
                        <Share size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex flex-col w-[350px] sticky top-0 h-screen px-6 py-2 gap-4">
          <div className="sticky top-2 bg-white z-10">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-[#1d9bf0] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">What's happening</h2>
            <TrendItem category="Business & finance · Trending" title="#SalesTech" posts="12.4K posts" />
            <TrendItem category="Technology · Trending" title="Clarix" posts="2,104 posts" />
            <TrendItem category="Trending in United States" title="CRM Automation" posts="5,432 posts" />
            <button className="text-[#1d9bf0] text-sm hover:underline mt-2">Show more</button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">Who to follow</h2>
            <FollowItem name="SalesOps Guru" handle="@salesops_guru" />
            <FollowItem name="Tech Stack Expert" handle="@stack_expert" />
            <button className="text-[#1d9bf0] text-sm hover:underline mt-2">Show more</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-4 p-3 rounded-full cursor-pointer hover:bg-gray-100 transition-colors w-fit pr-6 ${active ? 'font-bold' : ''}`}>
    {icon}
    <span className="text-xl hidden xl:block">{label}</span>
  </div>
);

const TrendItem = ({ category, title, posts }: { category: string, title: string, posts: string }) => (
  <div className="py-3 cursor-pointer hover:bg-gray-200/50 transition-colors">
    <div className="text-xs text-gray-500">{category}</div>
    <div className="font-bold">{title}</div>
    <div className="text-xs text-gray-500">{posts}</div>
  </div>
);

const FollowItem = ({ name, handle }: { name: string, handle: string }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex gap-2">
      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
        <img src={`https://picsum.photos/seed/${handle}/100/100`} alt={name} referrerPolicy="no-referrer" />
      </div>
      <div>
        <div className="font-bold text-sm hover:underline cursor-pointer">{name}</div>
        <div className="text-gray-500 text-sm">{handle}</div>
      </div>
    </div>
    <button className="bg-black text-white text-sm font-bold px-4 py-1.5 rounded-full">Follow</button>
  </div>
);

export default TwitterPage;
