import { NextRequest, NextResponse } from 'next/server';
import { smartRecruitment } from '@/lib/ai/recruitment';
import { verifyAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || !isAdmin(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'parse-resume': {
        const { content } = body;
        if (!content) {
          return NextResponse.json({ error: 'Resume content is required' }, { status: 400 });
        }
        const parsed = await smartRecruitment.parseResume(content);
        return NextResponse.json(parsed);
      }

      case 'match-candidate': {
        const { resume, requirements } = body;
        if (!resume || !requirements) {
          return NextResponse.json({ error: 'Resume and requirements are required' }, { status: 400 });
        }
        const match = await smartRecruitment.matchCandidate(resume, requirements);
        return NextResponse.json(match);
      }

      case 'analyze-bias': {
        const { description } = body;
        if (!description) {
          return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
        }
        const analysis = await smartRecruitment.analyzeJobDescriptionBias(description);
        return NextResponse.json(analysis);
      }

      case 'generate-questions': {
        const { resume, requirements, count } = body;
        if (!resume || !requirements) {
          return NextResponse.json({ error: 'Resume and requirements are required' }, { status: 400 });
        }
        const questions = await smartRecruitment.generateInterviewQuestions(resume, requirements, count || 10);
        return NextResponse.json({ questions });
      }

      case 'rank-candidates': {
        const { resumes, requirements } = body;
        if (!resumes || !requirements) {
          return NextResponse.json({ error: 'Resumes and requirements are required' }, { status: 400 });
        }
        const ranked = await smartRecruitment.rankCandidatesForJob(resumes, requirements);
        return NextResponse.json({ candidates: ranked });
      }

      case 'suggest-salary': {
        const { resume, requirements, location } = body;
        if (!resume || !requirements) {
          return NextResponse.json({ error: 'Resume and requirements are required' }, { status: 400 });
        }
        const salary = await smartRecruitment.suggestSalaryRange(resume, requirements, location);
        return NextResponse.json(salary);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Recruitment API error:', error);
    return NextResponse.json(
      { error: 'Failed to process recruitment request' },
      { status: 500 }
    );
  }
}
