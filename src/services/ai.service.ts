/**
 * AI Service
 * Business logic for AI features
 */

import { aiApi } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  sessionId: string;
  action?: {
    type: string;
    data: unknown;
  };
}

interface Prediction {
  employeeId: string;
  type: string;
  riskScore: number;
  riskLevel: string;
  factors: unknown[];
  recommendations: string[];
}

interface Analytics {
  type: string;
  data: unknown;
  insights: string[];
}

interface SentimentResult {
  sourceType: string;
  sourceId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
}

interface LearningRecommendation {
  employeeId: string;
  courseName: string;
  provider?: string;
  skillsCovered: string[];
  reason: string;
  priority: number;
}

class AIService {
  // =====================
  // Chat / Conversational AI
  // =====================

  /**
   * Send chat message
   */
  async chat(message: string, sessionId?: string): Promise<ApiResponse<ChatResponse>> {
    return aiApi.chat({ message, sessionId }) as Promise<ApiResponse<ChatResponse>>;
  }

  /**
   * Start new chat session
   */
  async startChatSession(): Promise<ApiResponse<{ sessionId: string }>> {
    return this.chat('Hello') as Promise<ApiResponse<{ sessionId: string }>>;
  }

  // =====================
  // Analytics
  // =====================

  /**
   * Get AI analytics
   */
  async getAnalytics(type?: string): Promise<ApiResponse<Analytics[]>> {
    return aiApi.getAnalytics({ type }) as Promise<ApiResponse<Analytics[]>>;
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(): Promise<ApiResponse<unknown>> {
    return aiApi.getDashboardAnalytics() as Promise<ApiResponse<unknown>>;
  }

  // =====================
  // Predictions
  // =====================

  /**
   * Get predictions
   */
  async getPredictions(params?: {
    employeeId?: string;
    type?: string;
  }): Promise<ApiResponse<Prediction[]>> {
    return aiApi.getPredictions(params) as Promise<ApiResponse<Prediction[]>>;
  }

  /**
   * Get attrition risk predictions
   */
  async getAttritionRisk(employeeId?: string): Promise<ApiResponse<Prediction[]>> {
    return this.getPredictions({ employeeId, type: 'ATTRITION' });
  }

  /**
   * Get performance predictions
   */
  async getPerformancePredictions(employeeId?: string): Promise<ApiResponse<Prediction[]>> {
    return this.getPredictions({ employeeId, type: 'PERFORMANCE' });
  }

  /**
   * Get workload predictions
   */
  async getWorkloadPredictions(employeeId?: string): Promise<ApiResponse<Prediction[]>> {
    return this.getPredictions({ employeeId, type: 'WORKLOAD' });
  }

  // =====================
  // Sentiment Analysis
  // =====================

  /**
   * Get sentiment analysis results
   */
  async getSentiment(sourceType?: string): Promise<ApiResponse<SentimentResult[]>> {
    return aiApi.getSentiment({ sourceType }) as Promise<ApiResponse<SentimentResult[]>>;
  }

  // =====================
  // Documents
  // =====================

  /**
   * Get AI processed documents
   */
  async getProcessedDocuments(): Promise<ApiResponse<unknown[]>> {
    return aiApi.getDocuments() as Promise<ApiResponse<unknown[]>>;
  }

  // =====================
  // Automation
  // =====================

  /**
   * Get automation rules
   */
  async getAutomationRules(): Promise<ApiResponse<unknown[]>> {
    return aiApi.getAutomation() as Promise<ApiResponse<unknown[]>>;
  }

  // =====================
  // Learning & Development
  // =====================

  /**
   * Get learning recommendations
   */
  async getLearningRecommendations(employeeId?: string): Promise<ApiResponse<LearningRecommendation[]>> {
    return aiApi.getLearning({ employeeId }) as Promise<ApiResponse<LearningRecommendation[]>>;
  }

  // =====================
  // Recruitment
  // =====================

  /**
   * Get recruitment data
   */
  async getRecruitment(): Promise<ApiResponse<unknown>> {
    return aiApi.getRecruitment() as Promise<ApiResponse<unknown>>;
  }

  /**
   * Upload and analyze resume
   */
  async uploadResume(file: File): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    return aiApi.uploadResume(formData) as Promise<ApiResponse<unknown>>;
  }

  // =====================
  // Stats
  // =====================

  /**
   * Get AI stats
   */
  async getStats(): Promise<ApiResponse<{
    totalPredictions: number;
    totalChatSessions: number;
    documentsProcessed: number;
    automationRulesActive: number;
  }>> {
    return aiApi.getStats() as Promise<ApiResponse<{
      totalPredictions: number;
      totalChatSessions: number;
      documentsProcessed: number;
      automationRulesActive: number;
    }>>;
  }

  // =====================
  // Utility Methods
  // =====================

  /**
   * Format prediction for display
   */
  formatPrediction(prediction: Prediction): {
    level: 'low' | 'medium' | 'high' | 'critical';
    color: string;
    label: string;
  } {
    const score = prediction.riskScore;

    if (score < 0.25) {
      return { level: 'low', color: 'green', label: 'Low Risk' };
    } else if (score < 0.5) {
      return { level: 'medium', color: 'yellow', label: 'Medium Risk' };
    } else if (score < 0.75) {
      return { level: 'high', color: 'orange', label: 'High Risk' };
    } else {
      return { level: 'critical', color: 'red', label: 'Critical Risk' };
    }
  }

  /**
   * Format sentiment for display
   */
  formatSentiment(result: SentimentResult): {
    emoji: string;
    color: string;
    label: string;
  } {
    switch (result.sentiment) {
      case 'positive':
        return { emoji: '😊', color: 'green', label: 'Positive' };
      case 'negative':
        return { emoji: '😞', color: 'red', label: 'Negative' };
      default:
        return { emoji: '😐', color: 'gray', label: 'Neutral' };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for testing
export { AIService };
