import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">About RESTROBUDDY</h1>
          <p className="text-xl text-emerald-100 mb-2">
            <strong>Your all-in-one solution for modern restaurant management</strong>
          </p>
          <p className="text-lg text-emerald-100">
            We're on a mission to help restaurants save money, increase revenue, and delight customers.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
            <p className="text-slate-700 mb-4 leading-relaxed">
              RESTROBUDDY was born from a simple observation: restaurant technology is too expensive and too complicated.
            </p>
            <p className="text-slate-700 mb-4 leading-relaxed">
              We saw restaurants paying thousands for proprietary hardware, locked into long-term contracts, and struggling with systems that took weeks to set up.
            </p>
            <p className="text-slate-700 leading-relaxed">
              We knew there had to be a better way. So we built RESTROBUDDY - affordable, flexible, and ready to go in under an hour.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-slate-700 mb-4 leading-relaxed">
              <strong>RESTROBUDDY does the heavy lifting</strong> so you can focus on what you do best - creating amazing food and experiences for your customers.
            </p>
            <p className="text-slate-700 mb-4 leading-relaxed">
              As your all-in-one solution for modern restaurant management, we help restaurants save their hard-earned money so they can increase their bottom line and reinvest in what matters most.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="border-0 shadow-lg text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Customer First</h3>
              <p className="text-slate-600">
                We build features that customers actually want and need
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Results Driven</h3>
              <p className="text-slate-600">
                Your success is our success. We measure our impact on your revenue
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Partner Mentality</h3>
              <p className="text-slate-600">
                We're in this together. Your feedback shapes our roadmap
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Join 500+ Happy Restaurants</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8 py-6" asChild>
            <Link to={createPageUrl("Pricing")}>
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 RESTROBUDDY. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            by Bold Intelligent Solutions Partners Inc. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}