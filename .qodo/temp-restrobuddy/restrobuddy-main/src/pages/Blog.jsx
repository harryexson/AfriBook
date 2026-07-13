import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Blog() {
  const blogPosts = [
    {
      title: "5 Ways to Increase Restaurant Revenue with Technology",
      excerpt: "Discover how modern restaurant technology can boost your bottom line by 20-30% without increasing overhead costs.",
      category: "Business Growth",
      author: "RESTROBUDDY Team",
      date: "Nov 20, 2024",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop"
    },
    {
      title: "SMS Ordering: The Future of Quick Service Restaurants",
      excerpt: "Learn how text-to-order technology is revolutionizing the way customers interact with their favorite restaurants.",
      category: "Technology",
      author: "RESTROBUDDY Team",
      date: "Nov 15, 2024",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop"
    },
    {
      title: "Reducing Wait Times: A Complete Guide",
      excerpt: "Implement these proven strategies to cut customer wait times and improve satisfaction scores.",
      category: "Operations",
      author: "RESTROBUDDY Team",
      date: "Nov 10, 2024",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=400&fit=crop"
    },
    {
      title: "Building Customer Loyalty in 2024",
      excerpt: "Modern loyalty programs that actually work - from points systems to personalized rewards.",
      category: "Marketing",
      author: "RESTROBUDDY Team",
      date: "Nov 5, 2024",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=400&fit=crop"
    },
    {
      title: "BYOD Kiosk Setup: Save Thousands on Hardware",
      excerpt: "How to turn any tablet into a powerful self-service ordering kiosk without expensive proprietary hardware.",
      category: "Technology",
      author: "RESTROBUDDY Team",
      date: "Oct 28, 2024",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
      title: "Kitchen Display Systems: Boost Efficiency by 40%",
      excerpt: "Replace paper tickets with digital kitchen displays and watch your kitchen operations transform.",
      category: "Operations",
      author: "RESTROBUDDY Team",
      date: "Oct 20, 2024",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-amber-500 text-white mb-6 text-sm px-4 py-2">RESTROBUDDY BLOG</Badge>
          <h1 className="text-5xl font-bold mb-4">Restaurant Insights & Tips</h1>
          <p className="text-xl text-emerald-100">
            Expert advice to help you grow your restaurant business
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, idx) => (
            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <Badge className="absolute top-3 left-3 bg-emerald-600">{post.category}</Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{post.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-16 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">More Content Coming Soon!</h3>
          <p className="text-slate-600 mb-6">
            We're working on bringing you more valuable insights and tips. Stay tuned!
          </p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to={createPageUrl("Contact")}>
              Subscribe to Updates <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2024 RESTROBUDDY. All rights reserved.</p>
          <p className="text-slate-500 text-sm font-semibold mt-1">by Bold Intelligent Solutions Partners Inc. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}