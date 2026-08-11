'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Clock,
  ArrowRight,
  Tag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Mail,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const categories = [
  'All',
  'Technology',
  'Business',
  'Culture',
  'Product Updates',
  'Community',
  'Tutorials',
];

const featuredPost = {
  title: 'How AfriBook Is Transforming Commerce Across 16 African Countries',
  excerpt:
    'From a simple marketplace MVP in Lagos to a pan-African platform serving millions — the story of how AfriBook is bridging the gap between local vendors and global customers.',
  category: 'Company',
  date: 'January 10, 2025',
  readTime: '8 min read',
  author: 'Amina Okafor',
};

const posts = [
  {
    title: '5 Trends Shaping African E-Commerce in 2025',
    excerpt:
      'From mobile-first shopping to social commerce, here are the key trends driving online retail across Africa.',
    category: 'Business',
    date: 'January 5, 2025',
    readTime: '6 min read',
  },
  {
    title: 'Building Trust in Digital Marketplaces: Lessons from AfriBook',
    excerpt:
      'How we built a verification and review system that has earned the trust of 50K+ vendors and 1M+ customers.',
    category: 'Technology',
    date: 'December 28, 2024',
    readTime: '5 min read',
  },
  {
    title: 'The Rise of Food Delivery in African Cities',
    excerpt:
      'A deep dive into how food delivery is transforming dining habits and creating opportunities for local restaurants.',
    category: 'Product Updates',
    date: 'December 20, 2024',
    readTime: '7 min read',
  },
  {
    title: 'Meet Our Community: Vendor Spotlight Series',
    excerpt:
      'Hear from vendors who have grown their businesses on AfriBook, from artisans in Accra to tech shops in Nairobi.',
    category: 'Community',
    date: 'December 15, 2024',
    readTime: '4 min read',
  },
  {
    title: 'Getting Started with AfriBook: A Complete Guide',
    excerpt:
      'Everything you need to know about creating your account, exploring services, and making your first purchase.',
    category: 'Tutorials',
    date: 'December 10, 2024',
    readTime: '10 min read',
  },
  {
    title: 'How AfriBook Supports Local Economies',
    excerpt:
      'The economic impact of connecting local vendors with customers through digital marketplace technology.',
    category: 'Community',
    date: 'December 5, 2024',
    readTime: '6 min read',
  },
  {
    title: 'Ride-Hailing in Africa: Challenges and Opportunities',
    excerpt:
      'Understanding the unique dynamics of transportation services across different African markets.',
    category: 'Business',
    date: 'November 28, 2024',
    readTime: '8 min read',
  },
  {
    title: 'Behind the Scenes: How We Build for Africa',
    excerpt:
      'A look at our engineering practices, the challenges of building for diverse markets, and our tech stack.',
    category: 'Technology',
    date: 'November 20, 2024',
    readTime: '7 min read',
  },
  {
    title: 'Celebrating African Culture Through Our Marketplace',
    excerpt:
      'How AfriBook celebrates and preserves African cultural heritage through its platform and community.',
    category: 'Culture',
    date: 'November 15, 2024',
    readTime: '5 min read',
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [email, setEmail] = useState('');

  const filteredPosts =
    activeCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-dark-500 via-dark-300 to-amber-600 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p
              variants={fadeIn}
              className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-4"
            >
              AfriBook Blog
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Stories, Insights & Updates
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Stay informed with the latest from AfriBook — product updates, industry
              insights, and stories from our community.
            </motion.p>
            <motion.div variants={fadeIn} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-amber-500"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="font-heading text-xl font-bold text-text-primary">
                Featured Article
              </h2>
            </div>
            <Link
              href="#"
              className="block bg-surface-secondary rounded-2xl border border-border hover:border-amber-500/50 transition-colors overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full">
                    {featuredPost.category}
                  </span>
                  <span className="text-sm text-text-tertiary flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-3 hover:text-amber-500 transition-colors">
                  {featuredPost.title}
                </h3>
                <p className="text-text-secondary mb-4 max-w-3xl">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-text-tertiary">
                  <span>By {featuredPost.author}</span>
                  <span>{featuredPost.date}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Blog Grid + Categories */}
      <section className="py-16 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Categories Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="sticky top-24"
              >
                <h3 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  Categories
                </h3>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeCategory === cat
                          ? 'bg-amber-500 text-white'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            </aside>

            {/* Posts Grid */}
            <div className="flex-1">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid md:grid-cols-2 gap-6"
              >
                {filteredPosts.map((post, i) => (
                  <motion.article
                    key={post.title}
                    variants={fadeIn}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href="#"
                      className="block bg-surface rounded-2xl p-6 border border-border hover:border-amber-500/50 transition-colors h-full"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full">
                          {post.category}
                        </span>
                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-text-primary mb-2 hover:text-amber-500 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-text-secondary text-sm mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-text-tertiary">
                        <span>{post.date}</span>
                        <span className="text-amber-500 flex items-center gap-1">
                          Read
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </motion.div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-12">
                <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-text-tertiary hover:border-amber-500 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      page === 1
                        ? 'bg-amber-500 text-white'
                        : 'border border-border text-text-secondary hover:border-amber-500'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-text-tertiary hover:border-amber-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto">
              Get the latest articles, product updates, and insights delivered to your
              inbox every week.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEmail('');
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500"
                required
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
            <p className="text-text-tertiary text-xs mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
