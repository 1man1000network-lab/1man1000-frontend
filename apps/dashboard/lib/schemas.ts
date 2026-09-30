import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

const campaignBaseSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().min(1, "Budget must be greater than 0"),
  startDate: z.string().min(1, "Start date & time is required"),
  endDate: z.string().min(1, "End date & time is required"),
  targetViewRange: z.object({
    min: z.number().min(0, "Minimum views must be 0 or greater"),
    max: z.number().min(1, "Maximum views must be greater than 0"),
  }),
  targetAudience: z.string().min(1, "Target audience is required"),
  industry: z.string().min(1, "Industry is required"),
  adCreatives: z.array(z.string()).optional(),
  paymentType: z.enum(["per_view", "per_views"]).optional(),
  paymentTiers: z
    .array(
      z.object({
        lowerLimit: z.number().min(1, "Lower limit must be 1 or greater"),
        upperLimit: z
          .number()
          .min(1, "Upper limit must be 1 or greater")
          .nullable(),
        amount: z.number().min(0, "Amount must be 0 or greater"),
      }),
    )
    .optional(),
  clientId: z.string().optional(),
  parentCampaignId: z.string().optional(),
});

export const campaignSchema = campaignBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date & time must be after start date & time",
    path: ["endDate"],
  },
);

export type CampaignFormData = z.infer<typeof campaignSchema>;

export const updateCampaignSchema = campaignBaseSchema.partial().extend({
  status: z
    .enum(["pending", "approved", "active", "paused", "completed", "rejected"])
    .optional(),
});

export type UpdateCampaignFormData = z.infer<typeof updateCampaignSchema>;

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  socialMediaHandles: z
    .object({
      tiktok: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
});

export type UserFormData = z.infer<typeof userSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  reason: z.string().optional(),
});

export type UpdateUserStatusFormData = z.infer<typeof updateUserStatusSchema>;

export const submissionSchema = z.object({
  campaignId: z.string().min(1, "Campaign is required"),
  screenshotUrl: z.string().url("Invalid screenshot URL"),
  extractedViewCount: z.number().min(0, "View count must be 0 or greater"),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;

export const reviewSubmissionSchema = z.object({
  approvalStatus: z.enum(["approved", "rejected"]),
  reviewNote: z.string().optional(),
});

export type ReviewSubmissionFormData = z.infer<typeof reviewSubmissionSchema>;

export const surveyQuestionSchema = z.object({
  type: z.enum([
    "text",
    "multiple_choice",
    "single_choice",
    "rating",
    "boolean",
  ]),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  order: z.number().min(0),
});

export const surveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z
    .array(surveyQuestionSchema)
    .min(1, "At least one question is required"),
  rewardAmount: z.number().min(0, "Reward must be 0 or greater"),
  maxResponses: z.number().min(1, "Max responses must be at least 1"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SurveyFormData = z.infer<typeof surveySchema>;

export const paymentSchema = z.object({
  influencerId: z.string().min(1, "Influencer is required"),
  campaignId: z.string().optional(),
  submissionId: z.string().optional(),
  amount: z.number().min(0, "Amount must be 0 or greater"),
  paymentMethod: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed"]),
  transactionId: z.string().optional(),
});

export type UpdatePaymentStatusFormData = z.infer<
  typeof updatePaymentStatusSchema
>;
