'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Bot,
  BarChart3,
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  Sparkles,
  MessageCircle,
  Shield,
  Lightbulb,
  Target,
  ChevronRight
} from 'lucide-react';

const AI_FEATURES = [
  {
    title: 'AI Assistant',
    description: '24/7 intelligent HR chatbot for employee queries',
    icon: Bot,
    href: '/admin/ai/assistant',
    color: 'bg-blue-500',
    features: ['Leave queries', 'Policy information', 'Payroll help'],
  },
  {
    title: 'AI Analytics',
    description: 'Natural language queries and automated insights',
    icon: BarChart3,
    href: '/admin/ai/analytics',
    color: 'bg-purple-500',
    features: ['Ask questions in plain English', 'Auto-generated insights', 'What-if scenarios'],
  },
  {
    title: 'Smart Recruitment',
    description: 'AI-powered hiring and candidate matching',
    icon: Users,
    href: '/admin/ai/recruitment',
    color: 'bg-green-500',
    features: ['Resume parsing', 'Candidate matching', 'Bias detection'],
  },
  {
    title: 'Learning & Development',
    description: 'Personalized skill development and mentoring',
    icon: GraduationCap,
    href: '/admin/ai/learning',
    color: 'bg-amber-500',
    features: ['Skill gap analysis', 'Learning paths', 'Mentor matching'],
  },
];

const AI_CAPABILITIES = [
  { icon: FileText, label: 'Document Processing', description: 'Auto-extract data from HR documents' },
  { icon: TrendingUp, label: 'Predictive Analytics', description: 'Attrition risk & performance forecasting' },
  { icon: MessageCircle, label: 'Sentiment Analysis', description: 'Analyze employee feedback & morale' },
  { icon: Shield, label: 'Smart Automation', description: 'Intelligent approvals & anomaly detection' },
];

export default function AIHubPage() {
  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Hub</h1>
          <p className="text-muted-foreground">Intelligent features powered by AI</p>
        </div>
        <Badge className="ml-auto text-sm py-1 px-3" variant="secondary">
          <Sparkles className="h-4 w-4 mr-1" />
          8 AI Features Active
        </Badge>
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {AI_FEATURES.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center justify-between">
                      {feature.title}
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </CardTitle>
                    <CardDescription className="mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {feature.features.map((f, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Additional Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            More AI Capabilities
          </CardTitle>
          <CardDescription>These features are integrated throughout the HRMS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AI_CAPABILITIES.map((cap, idx) => (
              <div key={idx} className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <cap.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{cap.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{cap.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">1,234</div>
            <p className="text-xs text-muted-foreground mt-1">AI Queries Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">89%</div>
            <p className="text-xs text-muted-foreground mt-1">Accuracy Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">156</div>
            <p className="text-xs text-muted-foreground mt-1">Documents Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-purple-600">42</div>
            <p className="text-xs text-muted-foreground mt-1">Insights Generated</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
