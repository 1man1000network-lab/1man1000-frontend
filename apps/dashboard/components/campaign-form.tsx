"use client";

import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Loader2, Info, Upload, X, FileImage } from "lucide-react";
import Link from "next/link";
import { campaignSchema, type CampaignFormData } from "@/lib/schemas";
import VideoPlayerComponent from "@/components/video-player";
import {
  ClientCombobox,
  type ClientOption,
} from "@/components/client-combobox";

const industries = [
  "Technology",
  "Fashion",
  "Food & Beverage",
  "Health & Fitness",
  "Beauty",
  "Entertainment",
  "Finance",
  "Education",
  "Travel",
  "Automotive",
  "Real Estate",
  "Other",
];

export type CampaignClientOption = ClientOption;

export type ParentCampaignOption = {
  id: string;
  title?: string | null;
  brandName: string;
};

export type CampaignFormProps = {
  defaultValues?: Partial<CampaignFormData>;
  submitLabel: string;
  cancelHref: string;
  isSubmitting: boolean;
  onSubmit: (data: CampaignFormData, file?: File) => void;
  isError?: boolean;
  errorText?: string;
  showBudgetEstimate?: boolean;
  containerClassName?: string;
  existingAssetUrl?: string;
  clients?: CampaignClientOption[];
  parentCampaign?: ParentCampaignOption | null;
};

export function CampaignForm({
  defaultValues,
  submitLabel,
  cancelHref,
  isSubmitting,
  onSubmit,
  isError,
  errorText,
  existingAssetUrl,
  showBudgetEstimate,
  containerClassName,
  clients,
  parentCampaign,
}: CampaignFormProps) {
  const mergedDefaults = useMemo(
    () => ({
      ratePerView: 0.5,
      submissionDeadlineDays: 7,
      paymentType: "per_view" as const,
      paymentViewsThreshold: 1000,
      targetViewRange: { min: 1000, max: 10000 },
      parentCampaignId: parentCampaign?.id,
      ...defaultValues,
    }),
    [defaultValues, parentCampaign],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: mergedDefaults,
  });

  const selectedClientId = watch("clientId");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const budget = watch("budget");
  const targetMax = watch("targetViewRange.max");

  const handleFileSelect = useCallback((file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image or video file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const removeFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleFormSubmit = (data: CampaignFormData) => {
    if (clients && !data.clientId) {
      setError("clientId", { message: "Please select a client" });
      return;
    }

    // datetime-local values carry no timezone — convert to an absolute
    // ISO instant in the user's timezone before sending to the API.
    const toIso = (value?: string) =>
      value ? new Date(value).toISOString() : value;

    onSubmit(
      { ...data, startDate: toIso(data.startDate)!, endDate: toIso(data.endDate)! },
      selectedFile || undefined,
    );
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={containerClassName || "space-y-6"}
    >
      {parentCampaign && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">
                Sub-campaign of "{parentCampaign.title || parentCampaign.brandName}"
              </p>
              <p className="text-muted-foreground">
                This campaign will be created as a sub-campaign feeding into the
                main campaign.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details of the campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clients && (
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Assign to Client <span className="text-destructive">*</span>
              </Label>
              <ClientCombobox
                clients={clients}
                value={selectedClientId}
                invalid={!!errors.clientId}
                onChange={(id) => {
                  setValue("clientId", id, { shouldValidate: true });
                  clearErrors("clientId");
                }}
              />
              {errors.clientId && (
                <p className="text-xs text-destructive">
                  {errors.clientId.message}
                </p>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandName">
                Brand Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brandName"
                placeholder="Enter brand name"
                {...register("brandName")}
                className={errors.brandName ? "border-destructive" : ""}
              />
              {errors.brandName && (
                <p className="text-xs text-destructive">
                  {errors.brandName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                placeholder="Enter campaign title"
                {...register("title")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Enter campaign description"
              {...register("description")}
              className="flex min-h-[100px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-border focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry <span className="text-destructive">*</span>
              </Label>
              <select
                id="industry"
                {...register("industry")}
                className={`flex h-11 w-full rounded-xl border bg-background px-4 py-2 text-sm shadow-sm transition-all hover:border-border focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 ${errors.industry ? "border-destructive" : "border-border/60"}`}
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-xs text-destructive">
                  {errors.industry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">
                Target Audience <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetAudience"
                placeholder="e.g., Young adults 18-35"
                {...register("targetAudience")}
                className={errors.targetAudience ? "border-destructive" : ""}
              />
              {errors.targetAudience && (
                <p className="text-xs text-destructive">
                  {errors.targetAudience.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget & Timeline</CardTitle>
          <CardDescription>
            Set the budget and campaign duration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="budget">
                Budget (GH₵) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="5000"
                {...register("budget", { valueAsNumber: true })}
                className={errors.budget ? "border-destructive" : ""}
              />
              {errors.budget && (
                <p className="text-xs text-destructive">
                  {errors.budget.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...register("startDate")}
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...register("endDate")}
                className={errors.endDate ? "border-destructive" : ""}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetViewRange.min">
                Min Target Views <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetViewRange.min"
                type="number"
                placeholder="1000"
                {...register("targetViewRange.min", { valueAsNumber: true })}
                className={
                  errors.targetViewRange?.min ? "border-destructive" : ""
                }
              />
              {errors.targetViewRange?.min && (
                <p className="text-xs text-destructive">
                  {errors.targetViewRange.min.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetViewRange.max">
                Max Target Views <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetViewRange.max"
                type="number"
                placeholder="10000"
                {...register("targetViewRange.max", { valueAsNumber: true })}
                className={
                  errors.targetViewRange?.max ? "border-destructive" : ""
                }
              />
              {errors.targetViewRange?.max && (
                <p className="text-xs text-destructive">
                  {errors.targetViewRange.max.message}
                </p>
              )}
            </div>
          </div>
{/* 
          {showBudgetEstimate && (
            <div className="rounded-xl bg-muted/50 p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Budget Estimate</p>
                <p className="text-muted-foreground">
                  With a budget of GH₵{(budget || 0).toLocaleString()}, you can
                  reach approximately {(targetMax || 0).toLocaleString()} views
                  depending on the rate per view set by the platform.
                </p>
              </div>
            </div>
          )} */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Asset (Optional)</CardTitle>
          <CardDescription>
            Upload an image or video that influencers can download and use in
            their posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFile && !existingAssetUrl ? (
            <div
              className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("campaignAsset")?.click()}
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
                Images (PNG, JPG, GIF, WebP) or Videos (MP4, WebM) up to 50MB
              </p>
              <input
                id="campaignAsset"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : selectedFile ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {selectedFile.type.startsWith("video/") ? (
                  <VideoPlayerComponent src={previewUrl || ""} />
                ) : (
                  <img
                    src={previewUrl || ""}
                    alt="Campaign asset preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
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
            </div>
          ) : existingAssetUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                {existingAssetUrl.match(/\.(mp4|webm|mov)$/i) ? (
                  <VideoPlayerComponent src={existingAssetUrl} />
                ) : (
                  <img
                    src={existingAssetUrl}
                    alt="Current campaign asset"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Current asset</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("campaignAsset")?.click()
                  }
                >
                  Replace
                </Button>
              </div>
              <input
                id="campaignAsset"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
          <p className="text-sm text-destructive">
            {errorText || "Failed to save campaign. Please try again."}
          </p>
        </div>
      )}
    </form>
  );
}
