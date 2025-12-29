import { NextRequest, NextResponse } from 'next/server';
import { hrChatbot } from '@/lib/ai/chatbot';
import { verifyAuth } from '@/lib/auth';

// Check if OpenAI is properly configured
const isOpenAIConfigured = (): boolean => {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && apiKey !== 'sk-placeholder-key' && apiKey.startsWith('sk-'));
};

// Fallback responses when AI is not available
const getFallbackResponse = (message: string): { response: string; suggestions: string[] } => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('leave') && lowerMessage.includes('balance')) {
    return {
      response: "To check your leave balance, please go to the Leave Management section in the sidebar. You can view your current balances for Sick Leave (12 days/year), Casual Leave (12 days/year), and Earned Leave (15 days/year).",
      suggestions: ['How to apply for leave?', 'View attendance', 'Contact HR'],
    };
  }

  if (lowerMessage.includes('apply') && lowerMessage.includes('leave')) {
    return {
      response: "To apply for leave:\n\n1. Go to Leave Management → Apply Leave\n2. Select the leave type (Sick, Casual, Earned, or Unpaid)\n3. Choose your start and end dates\n4. Add a reason for your leave\n5. Submit for manager approval\n\nYour manager will be notified and can approve or reject your request.",
      suggestions: ['Check leave balance', 'View pending leaves', 'Company holidays'],
    };
  }

  if (lowerMessage.includes('payslip') || lowerMessage.includes('salary')) {
    return {
      response: "You can view your payslips in the Payroll section. Go to Payroll → My Payslips to see your salary breakdown including basic pay, allowances, deductions, and net salary for each month.",
      suggestions: ['Tax information', 'Download payslip', 'HR contact'],
    };
  }

  if (lowerMessage.includes('attendance')) {
    return {
      response: "Your attendance records are available in the Attendance section. You can view your punch-in/punch-out times, total working hours, and attendance status for each day. If you see any discrepancies, please contact HR.",
      suggestions: ['Request attendance correction', 'View this month', 'Leave balance'],
    };
  }

  if (lowerMessage.includes('policy') || lowerMessage.includes('policies')) {
    return {
      response: "Company policies are available in the HR Documents section. Key policies include:\n\n• Leave Policy - Annual leave entitlements and procedures\n• Attendance Policy - Work hours and flexibility options\n• Code of Conduct - Professional behavior guidelines\n• Remote Work Policy - WFH eligibility and rules\n\nVisit HR Documents for full details.",
      suggestions: ['Leave policy details', 'Contact HR', 'View documents'],
    };
  }

  return {
    response: "I'm currently operating in offline mode. While I can help with basic HR queries, for more complex assistance please:\n\n• Check the relevant section in the sidebar\n• Contact HR directly at hr@company.com\n• Raise a support ticket\n\nHow else can I help you?",
    suggestions: ['Check leave balance', 'View attendance', 'Company policies', 'Contact HR'],
  };
};

export async function POST(request: NextRequest) {
  let message = '';

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;
    message = body.message || '';

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      console.log('OpenAI not configured, using fallback responses');
      const fallback = getFallbackResponse(message);
      return NextResponse.json(fallback);
    }

    const result = await hrChatbot.chat(
      sessionId || crypto.randomUUID(),
      auth.userId,
      message,
      auth.employeeId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);

    // If OpenAI fails, use fallback with the message we already parsed
    if (message) {
      const fallback = getFallbackResponse(message);
      return NextResponse.json(fallback);
    }

    return NextResponse.json({
      response: "I'm having trouble connecting right now. Please try again or contact HR directly for assistance.",
      suggestions: ['Try again', 'Contact HR'],
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const history = await hrChatbot.getChatHistory(sessionId);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}
