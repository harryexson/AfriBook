import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Rocket, 
  Heart,
  CheckCircle,
  Send,
  ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Careers() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedIn: "",
    experience: "",
    coverLetter: ""
  });

  const jobs = [
    {
      id: 1,
      title: "Sales Representative",
      department: "Sales",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$50,000 - $80,000 + Commission",
      description: "Join our dynamic sales team to help restaurants discover RESTROBUDDY's powerful platform.",
      responsibilities: [
        "Prospect and qualify new restaurant leads through outbound calling and email campaigns",
        "Conduct product demonstrations and presentations to potential customers",
        "Manage and grow a pipeline of opportunities in your assigned territory",
        "Meet and exceed monthly and quarterly sales quotas",
        "Collaborate with marketing team on lead generation campaigns",
        "Maintain accurate records in CRM system"
      ],
      requirements: [
        "2+ years of B2B sales experience, preferably in SaaS or technology",
        "Experience in startup business development preferred",
        "Excellent communication and presentation skills",
        "Self-motivated with a proven track record of exceeding targets",
        "Experience with CRM tools (Salesforce, HubSpot)",
        "Knowledge of the restaurant industry is a plus"
      ]
    },
    {
      id: 2,
      title: "Business Development Manager",
      department: "Business Development",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$70,000 - $100,000 + Commission",
      description: "Drive strategic partnerships and enterprise sales to accelerate RESTROBUDDY's growth.",
      responsibilities: [
        "Identify and pursue strategic partnership opportunities with restaurant groups and franchises",
        "Develop and execute business development strategies for new market segments",
        "Lead complex enterprise sales cycles from prospecting to close",
        "Build and maintain relationships with key decision-makers",
        "Analyze market trends and competitive landscape",
        "Collaborate with product team on customer feedback and feature requests"
      ],
      requirements: [
        "5+ years of business development or enterprise sales experience",
        "Experience in startup or high-growth company environment strongly preferred",
        "Proven track record in market development and customer acquisition",
        "Strong negotiation and strategic thinking skills",
        "Experience with restaurant technology, POS systems, or hospitality industry",
        "MBA or equivalent business experience preferred"
      ]
    },
    {
      id: 3,
      title: "Regional Business Development Manager",
      department: "Business Development",
      location: "Multiple Regions (US)",
      type: "Full-time",
      salary: "$80,000 - $120,000 + Commission",
      description: "Lead regional expansion efforts and build a strong presence in your assigned territory.",
      responsibilities: [
        "Own and develop business in your assigned regional territory",
        "Build and manage relationships with regional restaurant groups and chains",
        "Develop and execute regional go-to-market strategies",
        "Represent RESTROBUDDY at industry events, trade shows, and conferences",
        "Recruit and manage local sales representatives as the team grows",
        "Provide market intelligence and competitive insights to leadership"
      ],
      requirements: [
        "7+ years of sales or business development experience with regional responsibility",
        "Experience in startup business development and scaling teams",
        "Strong network in the restaurant or hospitality industry preferred",
        "Proven success in market development and customer acquisition",
        "Experience building and leading sales teams",
        "Willingness to travel within the region (25-50%)",
        "Entrepreneurial mindset with ability to work independently"
      ]
    },
    {
      id: 4,
      title: "Operations Manager",
      department: "Operations",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$65,000 - $90,000",
      description: "Oversee day-to-day operations and ensure smooth delivery of our services to customers.",
      responsibilities: [
        "Manage operational processes for customer onboarding and success",
        "Develop and optimize workflows to improve efficiency",
        "Coordinate between sales, support, and product teams",
        "Monitor and report on key operational metrics",
        "Identify and implement process improvements",
        "Manage vendor relationships and partnerships"
      ],
      requirements: [
        "4+ years of operations experience, preferably in SaaS or technology",
        "Experience in startup environments preferred",
        "Strong project management and organizational skills",
        "Excellent analytical and problem-solving abilities",
        "Experience with operational tools and software",
        "Strong communication skills across all levels"
      ]
    },
    {
      id: 5,
      title: "Customer Support Specialist",
      department: "Customer Success",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$40,000 - $55,000",
      description: "Provide exceptional support to help our restaurant customers succeed with RESTROBUDDY.",
      responsibilities: [
        "Respond to customer inquiries via chat, email, and phone",
        "Troubleshoot technical issues and provide solutions",
        "Guide customers through product features and best practices",
        "Document and escalate complex issues to appropriate teams",
        "Create and maintain support documentation and FAQs",
        "Gather customer feedback for product improvements"
      ],
      requirements: [
        "2+ years of customer service or technical support experience",
        "Technology background with ability to troubleshoot software issues",
        "Experience in SaaS customer support preferred",
        "Excellent written and verbal communication skills",
        "Patient, empathetic, and customer-focused attitude",
        "Ability to work flexible hours including some evenings/weekends"
      ]
    },
    {
      id: 6,
      title: "Senior Customer Support Lead",
      department: "Customer Success",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$55,000 - $75,000",
      description: "Lead our customer support team and drive excellence in customer satisfaction.",
      responsibilities: [
        "Lead and mentor the customer support team",
        "Handle escalated customer issues and complex technical problems",
        "Develop support processes, SLAs, and quality standards",
        "Train new support team members",
        "Analyze support metrics and implement improvements",
        "Collaborate with product team on feature requests and bug fixes"
      ],
      requirements: [
        "4+ years of customer support experience with 1+ years in leadership",
        "Strong technical background with software/technology experience",
        "Experience building and scaling support operations in startup environment",
        "Excellent problem-solving and communication skills",
        "Experience with support ticketing systems and CRM tools",
        "Knowledge of restaurant technology is a plus"
      ]
    }
  ];

  const handleApply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await base44.integrations.Core.SendEmail({
        to: "sales@restrobuddy.app",
        subject: `Job Application: ${selectedJob.title}`,
        body: `
New Job Application

Position: ${selectedJob.title}
Department: ${selectedJob.department}

Applicant Information:
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
LinkedIn: ${formData.linkedIn || "Not provided"}

Years of Relevant Experience: ${formData.experience}

Cover Letter / Why I'm Interested:
${formData.coverLetter}

---
Sent from RESTROBUDDY Careers Page
        `
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error:", error);
      alert("There was an error submitting your application. Please try again or email us directly at sales@restrobuddy.app");
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", linkedIn: "", experience: "", coverLetter: "" });
    setSubmitted(false);
    setShowApplyDialog(false);
    setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-amber-500 text-white mb-6 text-sm px-4 py-2">WE'RE HIRING</Badge>
          <h1 className="text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-emerald-100 mb-2">
            Help us transform the restaurant industry with innovative technology
          </p>
          <p className="text-lg text-emerald-100">
            We're looking for passionate individuals to join our growing team
          </p>
        </div>
      </div>

      {/* Why Join Us */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Why Join RESTROBUDDY?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Rocket, title: "Startup Energy", desc: "Fast-paced, high-growth environment" },
              { icon: Users, title: "Great Team", desc: "Work with talented, passionate people" },
              { icon: Heart, title: "Make Impact", desc: "Help restaurants thrive every day" },
              { icon: DollarSign, title: "Competitive Pay", desc: "Salary + commission + benefits" }
            ].map((item, idx) => (
              <Card key={idx} className="border-0 shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Open Positions</h2>
          <p className="text-center text-slate-600 mb-12">
            We're looking for team members with experience in sales, marketing, market development, customer acquisition, and startup business development
          </p>
          
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedJob(job)}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                        <Badge className="bg-emerald-100 text-emerald-700">{job.department}</Badge>
                      </div>
                      <p className="text-slate-600 mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.type}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                      </div>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob && !showApplyDialog} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <Badge className="w-fit bg-emerald-100 text-emerald-700 mb-2">{selectedJob.department}</Badge>
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedJob.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedJob.type}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {selectedJob.salary}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Responsibilities</h4>
                  <ul className="space-y-2">
                    {selectedJob.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Requirements</h4>
                  <ul className="space-y-2">
                    {selectedJob.requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={() => setShowApplyDialog(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 py-6">
                  Apply Now
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
              <p className="text-slate-600 mb-6">Thank you for your interest. We'll review your application and get back to you soon.</p>
              <Button onClick={resetForm}>Close</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
                <DialogDescription>Fill out the form below to submit your application.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleApply} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                  <Input id="linkedIn" value={formData.linkedIn} onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/yourprofile" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="experience">Years of Relevant Experience *</Label>
                  <Input id="experience" required value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} placeholder="e.g., 5 years" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="coverLetter">Why are you interested in this role? *</Label>
                  <Textarea id="coverLetter" required value={formData.coverLetter} onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })} className="mt-1 min-h-[100px]" placeholder="Tell us about your relevant experience and why you'd be a great fit..." />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Application</>}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

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