import React from 'react';
import { Star, Check, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const G2Page = () => {
  const reviews = [
    // Organic Reviews
    {
      id: 1,
      title: "Decent tool, but learning curve is steep",
      rating: 4,
      user: "Sarah J.",
      role: "Sales Operations Manager",
      company: "Mid-Market (51-1000 emp.)",
      date: "Feb 10, 2026",
      whatLike: "The data enrichment is quite accurate compared to other tools we've used. It saves us a lot of time on manual research.",
      whatDislike: "The documentation is a bit sparse. It took us a while to figure out how to set up the more complex automation workflows.",
      recommend: "Good for teams with a dedicated ops person who can spend time learning the system."
    },
    {
      id: 2,
      title: "Good for small teams, but UI needs work",
      rating: 3,
      user: "Michael R.",
      role: "Head of Growth",
      company: "Small-Business (50 or fewer emp.)",
      date: "Feb 25, 2026",
      whatLike: "The pricing is very competitive for the features you get. It's a great entry point for startups.",
      whatDislike: "The interface feels a bit dated and can be clunky at times. Navigating between different modules isn't as smooth as it could be.",
      recommend: "If you're on a budget, it's a solid choice, but be prepared for some UI frustrations."
    },
    {
      id: 3,
      title: "A solid alternative to the big players",
      rating: 4,
      user: "David L.",
      role: "SDR Lead",
      company: "Enterprise (1000+ emp.)",
      date: "Mar 5, 2026",
      whatLike: "The integration with Salesforce is robust. We haven't had any syncing issues so far.",
      whatDislike: "Customer support response times can be slow during peak hours. Sometimes it takes 24-48 hours to get a response.",
      recommend: "Worth a trial if you're looking to consolidate your sales tech stack."
    },
    // Review Bomb (Suspiciously similar structure)
    {
      id: 4,
      title: "Clarix is amazing!",
      rating: 5,
      user: "Alex T.",
      role: "Sales Manager",
      company: "Small-Business",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team increase conversions in 2 weeks. The automation feature alone is worth it.",
      whatDislike: "Nothing at all!",
      recommend: "Get it now!"
    },
    {
      id: 5,
      title: "Best tool ever",
      rating: 5,
      user: "Chris B.",
      role: "Growth Lead",
      company: "Mid-Market",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team boost lead quality in 3 days. The CRM integration alone is worth it.",
      whatDislike: "No complaints.",
      recommend: "Highly recommended."
    },
    {
      id: 6,
      title: "Game changer",
      rating: 5,
      user: "Jessica W.",
      role: "SDR",
      company: "Small-Business",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team scale outbound in 1 week. The data enrichment alone is worth it.",
      whatDislike: "Perfect tool.",
      recommend: "Don't wait."
    },
    {
      id: 7,
      title: "Love it!",
      rating: 5,
      user: "Ryan M.",
      role: "Sales Ops",
      company: "Mid-Market",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team improve efficiency in 5 days. The reporting feature alone is worth it.",
      whatDislike: "None.",
      recommend: "Must have."
    },
    {
      id: 8,
      title: "So helpful",
      rating: 5,
      user: "Emily K.",
      role: "Founder",
      company: "Small-Business",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team save time in 48 hours. The sequence builder alone is worth it.",
      whatDislike: "Everything is great.",
      recommend: "Try it today."
    },
    {
      id: 9,
      title: "Incredible results",
      rating: 5,
      user: "Jason P.",
      role: "Account Executive",
      company: "Mid-Market",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team hit targets in 10 days. The lead scoring alone is worth it.",
      whatDislike: "Nothing.",
      recommend: "Best in class."
    },
    {
      id: 10,
      title: "Highly recommend",
      rating: 5,
      user: "Sarah H.",
      role: "Marketing Manager",
      company: "Small-Business",
      date: "Mar 23, 2026",
      whatLike: "Clarix helped our team generate pipeline in 24 hours. The email tracking alone is worth it.",
      whatDislike: "No issues.",
      recommend: "Go for it."
    },
    {
      id: 11,
      title: "Great experience",
      rating: 5,
      user: "Kevin D.",
      role: "Sales Director",
      company: "Enterprise",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team optimize workflow in 1 week. The dashboard alone is worth it.",
      whatDislike: "None.",
      recommend: "Excellent tool."
    },
    {
      id: 12,
      title: "Fantastic tool",
      rating: 5,
      user: "Laura S.",
      role: "Growth Manager",
      company: "Mid-Market",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team accelerate growth in 2 weeks. The automation feature alone is worth it.",
      whatDislike: "Zero complaints.",
      recommend: "A must-buy."
    },
    {
      id: 13,
      title: "Simply the best",
      rating: 5,
      user: "Mark G.",
      role: "SDR Manager",
      company: "Small-Business",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team double bookings in 3 days. The CRM integration alone is worth it.",
      whatDislike: "Nothing bad.",
      recommend: "Highly recommend."
    },
    {
      id: 14,
      title: "Love Clarix",
      rating: 5,
      user: "Amanda F.",
      role: "Sales Rep",
      company: "Mid-Market",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team reach more leads in 5 days. The data enrichment alone is worth it.",
      whatDislike: "Perfect.",
      recommend: "Get it."
    },
    {
      id: 15,
      title: "Game changer for us",
      rating: 5,
      user: "Brian C.",
      role: "Head of Sales",
      company: "Small-Business",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team close deals in 48 hours. The reporting feature alone is worth it.",
      whatDislike: "None.",
      recommend: "Worth every penny."
    },
    {
      id: 16,
      title: "So easy to use",
      rating: 5,
      user: "Rachel L.",
      role: "Marketing Lead",
      company: "Mid-Market",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team simplify tasks in 10 days. The sequence builder alone is worth it.",
      whatDislike: "Nothing.",
      recommend: "Highly recommended."
    },
    {
      id: 17,
      title: "Excellent results",
      rating: 5,
      user: "Tom W.",
      role: "Sales Ops",
      company: "Enterprise",
      date: "Mar 24, 2026",
      whatLike: "Clarix helped our team maximize output in 24 hours. The lead scoring alone is worth it.",
      whatDislike: "No complaints.",
      recommend: "Best investment."
    }
  ];

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-[#2d2d2d]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="text-[#ff492c] font-black text-2xl tracking-tighter italic">G2</div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <span className="cursor-pointer hover:text-[#ff492c]">Software</span>
            <span className="cursor-pointer hover:text-[#ff492c]">Services</span>
            <button className="bg-[#ff492c] text-white px-4 py-2 rounded font-bold hover:bg-[#e63e24] transition-colors">
              Write a Review
            </button>
          </div>
        </div>
      </header>

      {/* Product Hero */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 bg-[#141414] rounded-xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            C
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Clarix</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-[#ffb400]">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <span className="font-bold">4.9 out of 5</span>
              <span className="text-gray-500">(128 reviews)</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">Sales Intelligence</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">CRM Automation</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">Lead Generation</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button className="bg-white border-2 border-[#ff492c] text-[#ff492c] font-bold py-2 px-6 rounded hover:bg-[#fff5f3] transition-colors">
              Compare
            </button>
            <button className="bg-[#ff492c] text-white font-bold py-2 px-6 rounded hover:bg-[#e63e24] transition-colors">
              Visit Website
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Filters */}
        <div className="hidden lg:block space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">Filters</h3>
            <div className="space-y-3">
              <FilterItem label="Verified User" checked />
              <FilterItem label="With Screenshots" />
              <FilterItem label="Video Reviews" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">Rating</h3>
            <div className="space-y-2">
              <RatingBar stars={5} percentage={92} />
              <RatingBar stars={4} percentage={6} />
              <RatingBar stars={3} percentage={2} />
              <RatingBar stars={2} percentage={0} />
              <RatingBar stars={1} percentage={0} />
            </div>
          </div>
        </div>

        {/* Middle Column - Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Reviews for Clarix</h2>
            <select className="bg-white border border-gray-300 rounded px-3 py-1 text-sm outline-none">
              <option>Most Recent</option>
              <option>Most Helpful</option>
            </select>
          </div>

          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#ff492c] hover:underline cursor-pointer">"{review.title}"</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-[#ffb400]">
                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                  <div className="bg-[#e7f6f2] text-[#008561] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Check size={12} /> VERIFIED USER
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                    {review.user[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{review.user}</div>
                    <div className="text-xs text-gray-500">{review.role}</div>
                    <div className="text-xs text-gray-500">{review.company}</div>
                  </div>
                </div>

                <div className="space-y-4 text-[15px] leading-relaxed">
                  <div>
                    <h4 className="font-bold mb-1">What do you like best about Clarix?</h4>
                    <p>{review.whatLike}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">What do you dislike about Clarix?</h4>
                    <p>{review.whatDislike}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">What recommendations to others considering Clarix?</h4>
                    <p>{review.recommend}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center gap-6 text-xs font-bold text-gray-500">
                <div className="flex items-center gap-1 cursor-pointer hover:text-[#ff492c]">
                  <ThumbsUp size={14} /> Helpful (12)
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-[#ff492c]">
                  <ThumbsDown size={14} /> Unhelpful
                </div>
                <div className="cursor-pointer hover:text-[#ff492c]">Comment</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const FilterItem = ({ label, checked = false }: { label: string, checked?: boolean }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${checked ? 'bg-[#ff492c] border-[#ff492c]' : 'border-gray-300 group-hover:border-[#ff492c]'}`}>
      {checked && <Check size={12} className="text-white" />}
    </div>
    <span className="text-sm">{label}</span>
  </label>
);

const RatingBar = ({ stars, percentage }: { stars: number, percentage: number }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-12">{stars} star</span>
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-[#ffb400]" style={{ width: `${percentage}%` }}></div>
    </div>
    <span className="w-8 text-right">{percentage}%</span>
  </div>
);

export default G2Page;
