"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCampaignsControllerFindOne,
  getSubmissionsControllerGetInfluencerSubmissionsQueryKey,
  getCampaignsControllerGetInfluencerCampaignsQueryKey,
} from "@workspace/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  ArrowLeft,
  Loader2,
  Upload,
  ImageIcon,
  AlertCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { submissionSchema, type SubmissionFormData } from "@/lib/schemas";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { extractViewCount } from "@/lib/services/ocrService";
import { isCampaignExpired } from "@/lib/campaign-utils";
import {
  validateImage,
  type Platform,
  type ImageValidationResult,
} from "@/lib/services/imageValidationService";
import Image from "next/image";

type Campaign = {
  id: string;
  brandName: string;
  title?: string;
  description?: string;
  targetViewRange: { min: number; max: number };
  ratePerView?: number;
  paymentTiers?: { lowerLimit: number; upperLimit?: number; amount: number }[];
  endDate: string;
  status?: string;
};

export default function SubmitCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ImageValidationResult | null>(null);

  const {
    data: response,
    isLoading: campaignLoading,
    isError: campaignError,
  } = useCampaignsControllerFindOne(campaignId);
  const campaign = response as Campaign | undefined;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      campaignId,
      extractedViewCount: 0,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const formData = new FormData();
      formData.append("campaignId", data.campaignId);
      formData.append("extractedViewCount", String(data.extractedViewCount));
      formData.append("screenshot", selectedFile!);

      const token = localStorage.getItem("auth-storage");
      const authData = token ? JSON.parse(token) : null;
      const accessToken = authData?.state?.token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/submissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message || "Failed to submit. Please try again.",
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getSubmissionsControllerGetInfluencerSubmissionsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getCampaignsControllerGetInfluencerCampaignsQueryKey(),
      });
      router.push("/influencer/submissions");
    },
  });

  const onSubmit = (data: SubmissionFormData) => {
    if (!selectedFile) {
      return;
    }

    submitMutation.mutate(data);
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setValue("screenshotUrl", url);
      setIsProcessing(true);

      try {
        // Run OCR and validation in parallel
        const [viewCount, validation] = await Promise.all([
          extractViewCount(file, platform),
          validateImage(file, platform),
        ]);

        // Set extracted view count
        setValue("extractedViewCount", viewCount);
        setValidationResult(validation);

        console.log("✅ OCR extracted:", viewCount, "views");
        if (validation.isFlagged) {
          console.warn("⚠️ Image flagged:", validation.flags);
        }
      } catch (error) {
        console.error("❌ Processing failed:", error);
        setValue("extractedViewCount", 0);
      } finally {
        setIsProcessing(false);
      }
    },
    [setValue, platform],
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationResult(null);
    setValue("screenshotUrl", "");
    setValue("extractedViewCount", 0);
  }, [setValue]);

  if (campaignLoading) {
    return <LoadingState text="Loading campaign details..." />;
  }

  if (campaignError || !campaign) {
    return (
      <ErrorState
        title="Campaign not found"
        message="The campaign you're looking for doesn't exist or you don't have access to it."
      />
    );
  }

  const c = campaign as Campaign;
  const isExpired = isCampaignExpired(c.endDate);
  const isPaused = c.status === "paused";
  const isUnavailable = c.status !== "approved" && c.status !== "active";

  if (isExpired || isPaused || isUnavailable) {
    const heading = isExpired
      ? "Campaign Expired"
      : isPaused
        ? "Campaign Paused"
        : "Submissions Closed";
    const message = isExpired
      ? `This campaign has expired. The deadline was ${new Date(c.endDate).toLocaleString()}. Submissions are no longer being accepted.`
      : isPaused
        ? "This campaign has been paused by an administrator. Submissions are temporarily disabled — check back later."
        : "This campaign is no longer accepting submissions.";

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/influencer/campaigns/${campaignId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
            <p className="text-muted-foreground">{c.title || c.brandName}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="rounded-full bg-destructive/10 w-16 h-16 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Submissions Closed</h2>
              <p className="text-muted-foreground mt-1">{message}</p>
            </div>
            <Button asChild>
              <Link href={`/influencer/campaigns/${campaignId}`}>
                Go Back to Campaign
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/influencer/campaigns/${campaignId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Submit Your Work
          </h1>
          <p className="text-muted-foreground">{c.title || c.brandName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Target Views</p>
              <p className="font-semibold">
                {c.targetViewRange?.min?.toLocaleString()} -{" "}
                {c.targetViewRange?.max?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Rate</p>
              {c.paymentTiers && c.paymentTiers.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {c.paymentTiers.map((tier, index) => (
                    <p
                      key={index}
                      className="font-semibold text-emerald-600 text-xs"
                    >
                      {tier.lowerLimit.toLocaleString()} -{" "}
                      {tier.upperLimit
                        ? `${tier.upperLimit.toLocaleString()} views`
                        : "+ views"}
                      : GH₵{tier.amount.toFixed(2)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-semibold text-emerald-600">
                  GH₵{c.ratePerView?.toFixed(2) || "0.00"} per view
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Deadline</p>
            <p className="font-semibold">
              {new Date(c.endDate).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Selection</CardTitle>
            <CardDescription>
              Select the platform where you posted this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as Platform)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screenshot Upload</CardTitle>
            <CardDescription>
              Upload a screenshot showing your view count. We'll automatically
              extract the view count using OCR.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() =>
                  document.getElementById("screenshot-upload")?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileSelect(file);
                }}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Images (PNG, JPG, GIF) up to 10MB
                </p>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative  rounded-lg overflow-hidden bg-muted">
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing image...</p>
                      </div>
                    </div>
                  )}
                  <Image
                    src={previewUrl || ""}
                    alt="Screenshot preview"
                    className="w-full h-full object-cover"
                    width={100}
                    height={100}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {validationResult?.isFlagged && (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-700">
                        Image Flagged
                      </p>
                      <ul className="text-yellow-600 text-xs mt-1 space-y-1">
                        {validationResult.flags.map((flag, i) => (
                          <li key={i}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Count</CardTitle>
            <CardDescription>
              {isProcessing
                ? "Extracting view count from screenshot..."
                : "Auto-extracted from your screenshot. You can edit if needed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extractedViewCount">
                View Count <span className="text-destructive">*</span>
              </Label>
              <Input
                id="extractedViewCount"
                type="number"
                placeholder="View count will be auto-extracted"
                disabled={isProcessing}
                {...register("extractedViewCount", { valueAsNumber: true })}
                className={
                  errors.extractedViewCount ? "border-destructive" : ""
                }
              />
              {errors.extractedViewCount && (
                <p className="text-xs text-destructive">
                  {errors.extractedViewCount.message}
                </p>
              )}
              {!isProcessing && selectedFile && (
                <p className="text-xs text-muted-foreground">
                  💡 Tip: The view count was automatically extracted using OCR.
                  Please verify it matches your screenshot.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700">Important</p>
                <p className="text-yellow-600">
                  Make sure the view count matches what's shown in your
                  screenshot. False submissions may result in account
                  suspension.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <input type="hidden" {...register("campaignId")} value={campaignId} />

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/influencer/campaigns/${campaignId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={submitMutation.isPending || isProcessing}
          >
            {submitMutation.isPending || isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isProcessing
              ? "Processing..."
              : submitMutation.isPending
                ? "Submitting..."
                : "Submit for Review"}
          </Button>
        </div>

        {submitMutation.isError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
            <p className="text-sm text-destructive">
              {submitMutation.error instanceof Error
                ? submitMutation.error.message
                : "Failed to submit. Please check your details and try again."}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
