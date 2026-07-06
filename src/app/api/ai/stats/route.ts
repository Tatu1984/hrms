import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';

// Get real AI Hub statistics from database
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get various AI statistics in parallel
    const [
      chatSessions,
      chatMessages,
      predictions,
      anomalies,
      insights,
      resumeAnalyses,
      sentimentAnalyses,
      skillGaps,
      learningRecs,
      mentorMatches,
      employeeCount,
      leaveStats,
      attendanceStats,
    ] = await Promise.all([
      // AI Chat stats
      prisma.aIChatSession.count({ where: { ...orgWhere(auth) } }),
      // AIChatMessage has no org column — scope via its parent session.
      prisma.aIChatMessage.count({ where: { session: { ...orgWhere(auth) } } }),

      // Predictions
      prisma.aIPrediction.count({ where: { ...orgWhere(auth), isActive: true } }),

      // Anomalies
      prisma.aIAnomaly.count({ where: { ...orgWhere(auth), status: 'OPEN' } }),

      // Insights
      prisma.aIInsight.count({ where: { ...orgWhere(auth), dismissed: false } }),

      // Resume analyses
      prisma.aIResumeAnalysis.count({ where: { ...orgWhere(auth) } }),

      // Sentiment
      prisma.aISentimentAnalysis.count({ where: { ...orgWhere(auth) } }),

      // Skill gaps
      prisma.aISkillGap.count({ where: { ...orgWhere(auth), isActive: true } }),

      // Learning recommendations
      prisma.aILearningRecommendation.count({ where: { ...orgWhere(auth) } }),

      // Mentor matches
      prisma.aIMentorMatch.count({ where: { ...orgWhere(auth) } }),

      // Employee stats for calculations
      prisma.employee.count({ where: { ...orgWhere(auth), isActive: true } }),

      // Leave stats (for team health)
      prisma.leave.groupBy({
        by: ['status'],
        where: { ...orgWhere(auth) },
        _count: true,
      }),

      // Attendance stats (last 30 days)
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          ...orgWhere(auth),
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      }),
    ]);

    // Calculate attendance rate
    const totalAttendance = attendanceStats.reduce((sum, s) => sum + s._count, 0);
    const presentCount = attendanceStats.find(s => s.status === 'PRESENT')?._count || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Calculate pending leaves
    const pendingLeaves = leaveStats.find(s => s.status === 'PENDING')?._count || 0;

    // Build response
    const stats = {
      overview: {
        totalAIQueries: chatMessages,
        chatSessions,
        documentsProcessed: resumeAnalyses + sentimentAnalyses,
        insightsGenerated: insights,
        // No accuracy tracking exists yet — return null rather than a fabricated figure.
        accuracyRate: null,
        accuracyRateAvailable: false,
      },
      predictions: {
        activePredictions: predictions,
        openAnomalies: anomalies,
        // No real at-risk model — do not fabricate an estimate.
        atRiskEmployees: null,
        atRiskEmployeesAvailable: false,
      },
      recruitment: {
        resumesParsed: resumeAnalyses,
        // We track resumes parsed but not candidate matches — don't invent a ratio.
        candidatesMatched: null,
        candidatesMatchedAvailable: false,
      },
      learning: {
        skillGapsIdentified: skillGaps,
        learningRecommendations: learningRecs,
        mentorMatches,
      },
      sentiment: {
        analysesCompleted: sentimentAnalyses,
        teamMorale: attendanceRate > 80 ? 'Good' : attendanceRate > 60 ? 'Fair' : 'Needs Attention',
      },
      teamHealth: {
        overallScore: Math.min(100, Math.round((attendanceRate * 0.4) + (employeeCount > 0 ? 40 : 0) + (pendingLeaves < 5 ? 20 : 10))),
        attendanceRate,
        pendingLeaves,
        activeEmployees: employeeCount,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('AI Stats API error:', error);

    // Return default stats on error
    return NextResponse.json({
      overview: {
        totalAIQueries: 0,
        chatSessions: 0,
        documentsProcessed: 0,
        insightsGenerated: 0,
        accuracyRate: null,
        accuracyRateAvailable: false,
      },
      predictions: {
        activePredictions: 0,
        openAnomalies: 0,
        atRiskEmployees: null,
        atRiskEmployeesAvailable: false,
      },
      recruitment: {
        resumesParsed: 0,
        candidatesMatched: null,
        candidatesMatchedAvailable: false,
      },
      learning: {
        skillGapsIdentified: 0,
        learningRecommendations: 0,
        mentorMatches: 0,
      },
      sentiment: {
        analysesCompleted: 0,
        teamMorale: 'N/A',
      },
      teamHealth: {
        overallScore: 0,
        attendanceRate: 0,
        pendingLeaves: 0,
        activeEmployees: 0,
      },
    });
  }
}
