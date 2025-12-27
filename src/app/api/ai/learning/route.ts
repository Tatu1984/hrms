import { NextRequest, NextResponse } from 'next/server';
import { learningDevelopment } from '@/lib/ai/learning';
import { verifyAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'analyze-skill-gap': {
        const { employeeId, targetRole } = body;
        const empId = employeeId || auth.employeeId;

        // Non-admins can only view their own skill gap
        if (empId !== auth.employeeId && !isAdmin(auth.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!empId) {
          return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        const analysis = await learningDevelopment.analyzeSkillGap(empId, targetRole);
        return NextResponse.json(analysis);
      }

      case 'find-mentors': {
        const { employeeId } = body;
        const empId = employeeId || auth.employeeId;

        if (!empId) {
          return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        const matches = await learningDevelopment.findMentorMatches(empId);
        return NextResponse.json({ matches });
      }

      case 'suggest-courses': {
        const { skill, level } = body;
        if (!skill) {
          return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
        }
        const courses = await learningDevelopment.suggestCourses(skill, level || 2);
        return NextResponse.json({ courses });
      }

      case 'create-recommendation': {
        if (!isAdmin(auth.role)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { employeeId, courseName, provider, skills, reason } = body;
        if (!employeeId || !courseName || !reason) {
          return NextResponse.json({ error: 'Employee ID, course name, and reason are required' }, { status: 400 });
        }

        await learningDevelopment.createRecommendation(employeeId, courseName, provider, skills || [], reason);
        return NextResponse.json({ success: true });
      }

      case 'update-recommendation-status': {
        const { recommendationId, status, feedback, rating } = body;
        if (!recommendationId || !status) {
          return NextResponse.json({ error: 'Recommendation ID and status are required' }, { status: 400 });
        }

        await learningDevelopment.updateRecommendationStatus(recommendationId, status, feedback, rating);
        return NextResponse.json({ success: true });
      }

      case 'team-skill-matrix': {
        if (!isAdmin(auth.role)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { department } = body;
        if (!department) {
          return NextResponse.json({ error: 'Department is required' }, { status: 400 });
        }

        const matrix = await learningDevelopment.getTeamSkillMatrix(department);
        return NextResponse.json(matrix);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Learning API error:', error);
    return NextResponse.json(
      { error: 'Failed to process learning request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || auth.employeeId;

    // Non-admins can only view their own recommendations
    if (employeeId !== auth.employeeId && !isAdmin(auth.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const recommendations = await learningDevelopment.getRecommendations(employeeId);
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Learning GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning data' },
      { status: 500 }
    );
  }
}
