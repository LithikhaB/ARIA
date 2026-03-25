import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Share2, 
  MoreHorizontal, 
  Search, 
  Bell, 
  Plus, 
  Menu,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const RedditPage = () => {
  const comments = [
    {
      id: 1,
      user: "SalesOps_Pro",
      time: "4h ago",
      content: "Has anyone actually managed to get Clarix working? Their onboarding is a nightmare. I've spent 3 days trying to sync our CRM and it just keeps throwing errors.",
      votes: 156,
      replies: [
        {
          id: 2,
          user: "GrowthHacker99",
          time: "3h ago",
          content: "Same here. Their customer support is non-existent. I've been waiting for a week to get a reply on a simple billing issue. It's like they took the money and ran.",
          votes: 84
        },
        {
          id: 3,
          user: "SDR_Manager_NYC",
          time: "2h ago",
          content: "The 'automation' they brag about is basically just a broken script that keeps crashing our Salesforce instance. We had to disconnect it before it did more damage.",
          votes: 42
        }
      ]
    },
    {
      id: 4,
      user: "TechStack_Addict",
      time: "5h ago",
      content: "Don't believe the G2 reviews. It's so obviously a review bomb. All those 5-star reviews use the exact same phrasing. This tool is barely functional in reality.",
      votes: 210,
      replies: [
        {
          id: 5,
          user: "Clarix_Victim_1",
          time: "4h ago",
          content: "Exactly. I tried it for a week and had to cancel. It's full of bugs and the data enrichment is 50% wrong. Total waste of time and money.",
          votes: 95
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b1416] text-[#d7dadc] font-sans">
      {/* Header */}
      <header className="bg-[#1a1a1b] border-b border-[#343536] sticky top-0 z-10 px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-[#272729] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff4500] rounded-full flex items-center justify-center text-white font-bold">r/</div>
            <span className="font-bold hidden md:block">reddit</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4 relative hidden sm:block">
          <Search className="absolute left-3 top-2.5 text-[#818384]" size={18} />
          <input 
            type="text" 
            placeholder="Search Reddit" 
            className="w-full bg-[#272729] border border-[#343536] rounded-full py-1.5 pl-10 pr-4 outline-none focus:bg-[#1a1a1b] focus:border-[#d7dadc]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#272729] rounded-full"><Bell size={20} /></button>
          <button className="p-2 hover:bg-[#272729] rounded-full"><Plus size={20} /></button>
          <div className="w-8 h-8 bg-[#2d2d2d] rounded-full ml-2"></div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1200px] mx-auto flex gap-6 p-4">
        {/* Left Sidebar - Navigation */}
        <aside className="hidden lg:flex flex-col w-[240px] gap-2">
          <NavItem label="Home" active />
          <NavItem label="Popular" />
          <NavItem label="All" />
          <div className="h-px bg-[#343536] my-2"></div>
          <div className="text-xs font-bold text-[#818384] px-4 py-2 uppercase tracking-wider">Communities</div>
          <NavItem label="r/sales" />
          <NavItem label="r/startups" />
          <NavItem label="r/SaaS" />
        </aside>

        {/* Feed */}
        <main className="flex-1 max-w-[800px] space-y-4">
          {/* Post Content */}
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-md overflow-hidden">
            <div className="flex">
              {/* Vote Bar */}
              <div className="w-10 bg-[#151516] p-2 flex flex-col items-center gap-1">
                <button className="text-[#818384] hover:text-[#ff4500] hover:bg-[#272729] p-1 rounded transition-colors"><ArrowUp size={20} /></button>
                <span className="text-xs font-bold">156</span>
                <button className="text-[#818384] hover:text-[#7193ff] hover:bg-[#272729] p-1 rounded transition-colors"><ArrowDown size={20} /></button>
              </div>

              {/* Post Body */}
              <div className="flex-1 p-3">
                <div className="flex items-center gap-2 text-xs text-[#818384] mb-2">
                  <div className="w-5 h-5 bg-[#ff4500] rounded-full flex items-center justify-center text-white font-bold text-[10px]">r/</div>
                  <span className="font-bold text-[#d7dadc] hover:underline cursor-pointer">r/sales</span>
                  <span>•</span>
                  <span>Posted by u/SalesOps_Pro 4h ago</span>
                </div>
                <h1 className="text-xl font-bold mb-3">Is Clarix the real deal?</h1>
                <p className="text-sm leading-relaxed mb-4">
                  We've been seeing a lot of buzz around Clarix lately. Our current stack is getting a bit bloated and I'm looking for something that can handle both enrichment and basic outbound automation.
                  <br /><br />
                  Has anyone here actually implemented it? Is it worth the switch from the bigger players?
                </p>
                <div className="flex items-center gap-4 text-[#818384] text-xs font-bold">
                  <div className="flex items-center gap-1 hover:bg-[#272729] p-2 rounded cursor-pointer transition-colors">
                    <MessageSquare size={16} /> 42 Comments
                  </div>
                  <div className="flex items-center gap-1 hover:bg-[#272729] p-2 rounded cursor-pointer transition-colors">
                    <Share2 size={16} /> Share
                  </div>
                  <div className="flex items-center gap-1 hover:bg-[#272729] p-2 rounded cursor-pointer transition-colors">
                    <MoreHorizontal size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-[#343536]">
              <div className="text-xs mb-2">Comment as <span className="text-[#4fbcff]">u/User_123</span></div>
              <div className="border border-[#343536] rounded-md overflow-hidden">
                <textarea 
                  placeholder="What are your thoughts?" 
                  className="w-full bg-[#1a1a1b] p-3 text-sm outline-none min-h-[100px] resize-none"
                />
                <div className="bg-[#272729] p-2 flex justify-end">
                  <button className="bg-[#d7dadc] text-[#1a1a1b] px-4 py-1 rounded-full text-xs font-bold hover:bg-[#ffffff] transition-colors">
                    Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="p-4 space-y-6">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Community Info */}
        <aside className="hidden xl:flex flex-col w-[312px] gap-4">
          <div className="bg-[#1a1a1b] border border-[#343536] rounded-md overflow-hidden">
            <div className="h-8 bg-[#0079d3]"></div>
            <div className="p-3">
              <div className="flex items-center gap-3 -mt-6 mb-3">
                <div className="w-14 h-14 bg-[#ff4500] rounded-full border-4 border-[#1a1a1b] flex items-center justify-center text-white font-bold text-xl">r/</div>
                <h2 className="text-sm font-bold mt-4">r/sales</h2>
              </div>
              <p className="text-xs mb-4 leading-relaxed">
                The leading community for sales professionals. Discussing strategy, tools, and career advice.
              </p>
              <div className="flex gap-8 mb-4">
                <div>
                  <div className="text-sm font-bold">245k</div>
                  <div className="text-[10px] text-[#818384] uppercase">Members</div>
                </div>
                <div>
                  <div className="text-sm font-bold">1.2k</div>
                  <div className="text-[10px] text-[#818384] uppercase">Online</div>
                </div>
              </div>
              <button className="w-full bg-[#d7dadc] text-[#1a1a1b] py-1.5 rounded-full text-sm font-bold hover:bg-[#ffffff] transition-colors mb-2">
                Join
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const NavItem = ({ label, active = false }: { label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-[#272729] transition-colors ${active ? 'bg-[#272729] font-bold' : ''}`}>
    <div className="w-5 h-5 bg-[#343536] rounded-full"></div>
    <span className="text-sm">{label}</span>
  </div>
);

const CommentItem = ({ comment, isReply = false }: { comment: any, isReply?: boolean, key?: any }) => (
  <div className={`flex gap-3 ${isReply ? 'ml-8 mt-4' : ''}`}>
    <div className="flex flex-col items-center">
      <div className="w-7 h-7 bg-[#2d2d2d] rounded-full"></div>
      <div className="w-0.5 flex-1 bg-[#343536] mt-2"></div>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className="font-bold text-[#d7dadc] hover:underline cursor-pointer">{comment.user}</span>
        <span className="text-[#818384]">{comment.time}</span>
      </div>
      <p className="text-sm mb-2 leading-relaxed">{comment.content}</p>
      <div className="flex items-center gap-4 text-[#818384] text-xs font-bold">
        <div className="flex items-center gap-1">
          <button className="hover:text-[#ff4500] hover:bg-[#272729] p-1 rounded transition-colors"><ArrowUp size={16} /></button>
          <span>{comment.votes}</span>
          <button className="hover:text-[#7193ff] hover:bg-[#272729] p-1 rounded transition-colors"><ArrowDown size={16} /></button>
        </div>
        <div className="flex items-center gap-1 hover:bg-[#272729] p-1 rounded cursor-pointer transition-colors">
          <MessageSquare size={14} /> Reply
        </div>
        <div className="hover:bg-[#272729] p-1 rounded cursor-pointer transition-colors">Share</div>
      </div>
      {comment.replies && comment.replies.map((reply: any) => (
        <CommentItem key={reply.id} comment={reply} isReply />
      ))}
    </div>
  </div>
);

export default RedditPage;
