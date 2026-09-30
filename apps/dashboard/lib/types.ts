export type UserRole = "admin" | "client" | "influencer";
export type UserStatus = "pending" | "approved" | "rejected";
export type CampaignStatus =
  | "pending"
  | "approved"
  | "paused"
  | "completed"
  | "rejected";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "processing" | "completed" | "failed";
export type SurveyStatus =
  | "draft"
  | "pending"
  | "approved"
  | "active"
  | "paused"
  | "completed"
  | "closed"
  | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  socialMediaHandles?: SocialMediaHandles;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMediaHandles {
  tiktok?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  client?: User;
  brandName: string;
  title?: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetViewRange: TargetViewRange;
  targetAudience: string;
  industry: string;
  adCreatives?: string[];
  ratePerView?: number;
  submissionDeadlineDays?: number;
  paymentType?: "per_view" | "per_views";
  paymentViewsThreshold?: number;
  status: CampaignStatus;
  assignedInfluencers?: CampaignAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface TargetViewRange {
  min: number;
  max: number;
}

export interface CampaignAssignment {
  id: string;
  campaignId: string;
  influencerId: string;
  influencer?: User;
  assignedAt: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  campaign?: Campaign;
  influencerId: string;
  influencer?: User;
  screenshotUrl: string;
  extractedViewCount: number;
  approvalStatus: SubmissionStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  influencerId: string;
  influencer?: User;
  campaignId?: string;
  campaign?: Campaign;
  submissionId?: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  clientId: string;
  client?: User;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  rewardAmount: number;
  maxResponses: number;
  responsesCollected: number;
  status: SurveyStatus;
  startDate?: string;
  endDate?: string;
  assignedInfluencers?: SurveyAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  type: "text" | "multiple_choice" | "single_choice" | "rating" | "boolean";
  question: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface SurveyAssignment {
  id: string;
  surveyId: string;
  influencerId: string;
  influencer?: User;
  assignedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  influencerId: string;
  influencer?: User;
  answers: Record<string, unknown>;
  completedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers?: number;
  totalInfluencers?: number;
  totalClients?: number;
  activeCampaigns?: number;
  pendingSubmissions?: number;
  totalViews?: number;
  totalPayouts?: number;
  pendingPayments?: number;
}
