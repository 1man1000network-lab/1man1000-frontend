"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CampaignAssetModal } from "@/components/campaign-asset-modal";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCampaignsControllerFindOne,
  useCampaignsControllerUpdateStatus,
  useCampaignsControllerDelete,
  useSubmissionsControllerGetCampaignSubmissions,
  getCampaignsControllerFindOneQueryKey,
  getCampaignsControllerFindAllQueryKey,
  UpdateCampaignStatusDtoStatus,
} from "@workspace/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  Target,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  UserPlus,
  Loader2,
  Download,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Pause,
  Play,
  OctagonX,
  GitBranch,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { downloadCampaignAsset } from "@/lib/services/downloadService";
import Link from "next/link";
import VideoPlayerComponent from "@/components/video-player";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import Image from "next/image";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsLimit, setAssignmentsLimit] = useState(10);
  const [sortBy, setSortBy] = useState<"submissionDate" | "views">(
    "submissionDate",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewingScreenshot, setViewingScreenshot] = useState<any>(null);
  const [copiedDescription, setCopiedDescription] = useState(false);

  // Approval modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [paymentTiers, setPaymentTiers] = useState<
    { lowerLimit: string; upperLimit: string; amount: string }[]
  >([{ lowerLimit: "0", upperLimit: "", amount: "" }]);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useCampaignsControllerFindOne(campaignId);
  const campaign = response;

  const { data: submissionsResponse, isLoading: isSubmissionsLoading } =
    useSubmissionsControllerGetCampaignSubmissions(campaignId, {
      page: submissionsPage,
      limit: submissionsLimit,
      sortBy,
      sortOrder,
    });

  const submissions = submissionsResponse?.data || [];
  const submissionsMeta = submissionsResponse?.meta;

  const updateMutation = useCampaignsControllerUpdateStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getCampaignsControllerFindOneQueryKey(campaignId),
        });
        queryClient.invalidateQueries({
          queryKey: getCampaignsControllerFindAllQueryKey(),
        });
      },
    },
  });

  const deleteMutation = useCampaignsControllerDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getCampaignsControllerFindAllQueryKey(),
        });
        router.push("/admin/campaigns");
      },
    },
  });

  const handleApproveClick = () => {
    // Pre-fill if campaign already has payment tiers
    if (c.paymentTiers && c.paymentTiers.length > 0) {
      setPaymentTiers(
        c.paymentTiers.map((tier) => ({
          lowerLimit: String(tier.lowerLimit),
          upperLimit: tier.upperLimit ? String(tier.upperLimit) : "",
          amount: String(tier.amount),
        })),
      );
    } else {
      setPaymentTiers([{ lowerLimit: "0", upperLimit: "", amount: "" }]);
    }
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    try {
      // Validate and transform payment tiers
      const validTiers = paymentTiers
        .filter((tier) => tier.amount && parseFloat(tier.amount) > 0)
        .map((tier) => ({
          lowerLimit: parseInt(tier.lowerLimit) || 0,
          upperLimit: tier.upperLimit ? parseInt(tier.upperLimit) : null,
          amount: parseFloat(tier.amount) || 0,
        }));

      if (validTiers.length === 0) {
        alert("Please configure at least one payment tier with a valid amount");
        return;
      }

      await updateMutation.mutateAsync({
        id: campaignId,
        data: {
          status: UpdateCampaignStatusDtoStatus.approved,
          paymentTiers: validTiers as any,
        },
      });
      setShowApproveModal(false);
      setPaymentTiers([{ lowerLimit: "0", upperLimit: "", amount: "" }]);
    } catch (error) {
      console.error("Error approving campaign:", error);
    }
  };

  const handleEnd = () => {
    if (
      window.confirm(
        "End this campaign? It will be marked as completed and will no longer accept participation or submissions.",
      )
    ) {
      updateMutation.mutate({
        id: campaignId,
        data: { status: UpdateCampaignStatusDtoStatus.completed },
      });
    }
  };

  const handleViewScreenshot = (submission: any) => {
    setViewingScreenshot(submission);
  };

  const handleCopyDescription = async () => {
    if (c.description) {
      try {
        await navigator.clipboard.writeText(c.description);
        setCopiedDescription(true);
        // Reset after 2 seconds
        setTimeout(() => setCopiedDescription(false), 2000);
      } catch (err) {
        console.error("Failed to copy description:", err);
      }
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading campaign details..." />;
  }

  if (isError || !campaign) {
    return (
      <ErrorState
        title="Failed to load campaign"
        message="There was an error loading the campaign details."
        onRetry={() => refetch()}
      />
    );
  }

  const c = campaign;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {c.title || c.brandName}
              </h1>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-muted-foreground">
              {c.brandName} • {c.client?.name || "Unknown Client"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {c.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                onClick={handleApproveClick}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() =>
                  updateMutation.mutate({
                    id: campaignId,
                    data: { status: UpdateCampaignStatusDtoStatus.rejected },
                  })
                }
                disabled={updateMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {c.status === "approved" && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  updateMutation.mutate({
                    id: campaignId,
                    data: { status: UpdateCampaignStatusDtoStatus.paused },
                  })
                }
                disabled={updateMutation.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleEnd}
                disabled={updateMutation.isPending}
              >
                <OctagonX className="h-4 w-4 mr-2" />
                End Campaign
              </Button>
            </>
          )}
          {c.status === "paused" && (
            <>
              <Button
                variant="outline"
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                onClick={() =>
                  updateMutation.mutate({
                    id: campaignId,
                    data: { status: UpdateCampaignStatusDtoStatus.approved },
                  })
                }
                disabled={updateMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleEnd}
                disabled={updateMutation.isPending}
              >
                <OctagonX className="h-4 w-4 mr-2" />
                End Campaign
              </Button>
            </>
          )}
          {!c.parentCampaignId && (
            <Button variant="outline" asChild>
              <Link href={`/admin/campaigns/new?parent=${campaignId}`}>
                <GitBranch className="h-4 w-4 mr-2" />
                Sub-Campaign
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/campaigns/${campaignId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this campaign? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate({ id: campaignId })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {c.parentCampaign && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <GitBranch className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <span className="text-muted-foreground">
                Sub-campaign of{" "}
              </span>
              <Link
                href={`/admin/campaigns/${c.parentCampaign.id}`}
                className="font-medium text-primary hover:underline"
              >
                {c.parentCampaign.title || c.parentCampaign.brandName}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold">
                GH₵{c.budget?.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">
                {c.targetViewRange?.min?.toLocaleString()} -{" "}
                {c.targetViewRange?.max?.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Influencers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <span className="text-2xl font-bold">
                {c.assignments?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-lg font-semibold">
                {new Date(c.startDate).toLocaleDateString()} -{" "}
                {new Date(c.endDate).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan-600" />
              <span className="text-2xl font-bold">
                {(c.totalViews || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold">
                {c._count?.submissions || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-campaigns */}
      {!!c.subCampaigns?.length && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sub-Campaigns ({c.subCampaigns.length})</CardTitle>
              <CardDescription>
                Smaller campaigns feeding into this campaign
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/campaigns/new?parent=${campaignId}`}>
                <GitBranch className="h-4 w-4 mr-2" />
                Create Sub-Campaign
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {c.subCampaigns.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/admin/campaigns/${sub.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {sub.title || sub.brandName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sub.brandName} · Ends{" "}
                      {new Date(sub.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {(sub.totalViews || 0).toLocaleString()} views
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Submissions ({c._count?.submissions || 0})</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "submissionDate" | "views");
                  setSubmissionsPage(1);
                }}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                <option value="submissionDate">Sort by Date</option>
                <option value="views">Sort by Views</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  setSubmissionsPage(1);
                }}
              >
                {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
              </Button>
            </div>
          </div>
          {submissionsMeta && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-muted-foreground">Rows</span>
                  <select
                    value={submissionsLimit}
                    onChange={(e) => {
                      setSubmissionsLimit(Number(e.target.value));
                      setSubmissionsPage(1);
                    }}
                    className="text-sm border rounded px-2 py-1.5 bg-background"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
                  disabled={submissionsPage === 1 || isSubmissionsLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {submissionsPage} of{" "}
                  {(submissionsMeta as { totalPages?: number }).totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSubmissionsPage((p) =>
                      Math.min(
                        (submissionsMeta as { totalPages?: number })
                          .totalPages || 1,
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    !(submissionsMeta as { hasNextPage?: boolean })
                      .hasNextPage || isSubmissionsLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
        </CardHeader>
        <CardContent>
          {isSubmissionsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No submissions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Influencer
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Submissions
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Views
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className={`border-b last:border-0 ${
                        submission.isDuplicate ? "bg-orange-50/50" : ""
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={
                              submission.influencer?.id
                                ? `/admin/users/${submission.influencer.id}`
                                : "#"
                            }
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                          >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                              {submission.influencer?.name
                                ?.slice(0, 2)
                                .toUpperCase() || "??"}
                            </div>
                            <span className="font-medium hover:underline">
                              {submission.influencer?.name || "Unknown"}
                            </span>
                          </Link>
                          <div className="flex items-center gap-2">
                            {submission.isDuplicate && (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-200"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Duplicate
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {submission.submissionCount || 1}
                          </span>
                          {submission.isDuplicate && (
                            <span className="text-xs text-muted-foreground">
                              submissions
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {submission.verifiedViewCount?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={submission.approvalStatus} />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {submission.submissionDate
                          ? new Date(
                              submission.submissionDate,
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewScreenshot(submission)}
                          disabled={!submission.screenshotUrl}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {c.description && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyDescription}
                    className="h-8 w-8 p-0"
                  >
                    {copiedDescription ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm">{c.description}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Industry
                </h4>
                <Badge variant="outline">{c.industry}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Target Audience
                </h4>
                <p className="text-sm">{c.targetAudience}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Payment Tiers
                </h4>
                {c.paymentTiers && c.paymentTiers.length > 0 ? (
                  <div className="space-y-2">
                    {c.paymentTiers.map((tier, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Badge variant="outline" className="font-mono">
                          {tier.lowerLimit.toLocaleString()}
                          {tier.upperLimit
                            ? ` - ${tier.upperLimit.toLocaleString()}`
                            : "+"}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">
                          GH₵{tier.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No payment tiers configured
                  </p>
                )}
              </div>
            </div>

            {c.campaignAsset && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Campaign Asset
                </h4>
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-lg bg-muted max-w-2xl">
                    {c.campaignAsset.match(/\.(mp4|webm|ogg)$/i) ? (
                      <VideoPlayerComponent src={c.campaignAsset} />
                    ) : (
                      <Image
                        src={c.campaignAsset}
                        alt="Campaign asset"
                        className="w-full h-full object-cover"
                        width={500}
                        height={500}
                      />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCampaignAsset(
                        c.campaignAsset!,
                        c.title || c.brandName,
                        {
                          onError: (err: Error) => {
                            console.error("Download failed:", err);
                            alert(err.message || "Failed to download asset");
                          },
                        },
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Asset
                  </Button>
                </div>
              </div>
            )}

            {c.adCreatives && c.adCreatives.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Ad Creatives
                </h4>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {c.adCreatives.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={url}
                        alt={`Creative ${index + 1}`}
                        className="w-full h-24 object-cover"
                        width={500}
                        height={500}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Assigned Influencers ({c.assignments?.length || 0})
            </CardTitle>
            <Button size="sm" asChild>
              <Link href={`/admin/campaigns/${campaignId}/influencers`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {!c.assignments || c.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No influencers assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {(c.assignments || [])
                  .slice(
                    (assignmentsPage - 1) * assignmentsLimit,
                    assignmentsPage * assignmentsLimit,
                  )
                  .map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <Link
                        href={
                          assignment.influencer?.id
                            ? `/admin/users/${assignment.influencer.id}`
                            : "#"
                        }
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold hover:opacity-80 transition-opacity"
                      >
                        {assignment.influencer?.name
                          ?.slice(0, 2)
                          .toUpperCase() || "??"}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={
                            assignment.influencer?.id
                              ? `/admin/users/${assignment.influencer.id}`
                              : "#"
                          }
                          className="text-sm font-medium truncate block hover:underline"
                        >
                          {assignment.influencer?.name || "Unknown"}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {assignment.influencer?.email}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
          {c.assignments && c.assignments.length > 0 && (
              <div className="border-t p-4 flex items-center justify-between gap-2 bg-card shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows</span>
                  <select
                    value={assignmentsLimit}
                    onChange={(e) => {
                      setAssignmentsLimit(Number(e.target.value));
                      setAssignmentsPage(1);
                    }}
                    className="text-sm border rounded px-2 py-1.5 bg-background"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignmentsPage((p) => Math.max(1, p - 1))}
                  disabled={assignmentsPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {assignmentsPage} of{" "}
                  {Math.ceil(c.assignments.length / assignmentsLimit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAssignmentsPage((p) =>
                      Math.min(
                        Math.ceil(c.assignments!.length / assignmentsLimit),
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    assignmentsPage >=
                    Math.ceil(c.assignments.length / assignmentsLimit)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
        </Card>
      </div>

      {c.campaignAsset && showAssetModal && (
        <CampaignAssetModal
          assetUrl={c.campaignAsset}
          campaignTitle={c.title || c.brandName}
          isOpen={showAssetModal}
          onClose={() => setShowAssetModal(false)}
        />
      )}

      {/* Approval Modal with Payment Tier Settings */}
      <Dialog
        open={showApproveModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowApproveModal(false);
            setPaymentTiers([{ lowerLimit: "0", upperLimit: "", amount: "" }]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Approve Campaign</DialogTitle>
            <DialogDescription>
              Configure payment tiers for &quot;{c.title || c.brandName}
              &quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Tiers</CardTitle>
                <CardDescription>
                  Define payment ranges for influencers. Leave upper limit empty
                  for infinity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="grid gap-4 sm:grid-cols-3 items-end"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`lowerLimit-${index}`}>
                        Lower Limit (views)
                      </Label>
                      <Input
                        id={`lowerLimit-${index}`}
                        type="number"
                        placeholder="0"
                        value={tier.lowerLimit}
                        onChange={(e) => {
                          const newTiers = [...paymentTiers] as any;
                          newTiers[index].lowerLimit = e.target.value;
                          setPaymentTiers(newTiers);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`upperLimit-${index}`}>
                        Upper Limit (views)
                      </Label>
                      <Input
                        id={`upperLimit-${index}`}
                        type="number"
                        placeholder="∞ (empty = infinity)"
                        value={tier.upperLimit}
                        onChange={(e) => {
                          const newTiers = [...paymentTiers] as any;
                          newTiers[index].upperLimit = e.target.value;
                          setPaymentTiers(newTiers);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`amount-${index}`}>Amount (GH₵)</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0.50"
                          value={tier.amount}
                          onChange={(e) => {
                            const newTiers = [...paymentTiers] as any;
                            newTiers[index].amount = e.target.value;
                            setPaymentTiers(newTiers);
                          }}
                        />
                        {paymentTiers.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newTiers = paymentTiers.filter(
                                (_, i) => i !== index,
                              );
                              setPaymentTiers(newTiers);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    setPaymentTiers([
                      ...paymentTiers,
                      { lowerLimit: "", upperLimit: "", amount: "" },
                    ])
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Tier
                </Button>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setPaymentTiers([
                  { lowerLimit: "0", upperLimit: "", amount: "" },
                ]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={
                updateMutation.isPending ||
                !paymentTiers.some(
                  (tier) => tier.amount && parseFloat(tier.amount) > 0,
                )
              }
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screenshot Dialog */}
      <Dialog
        open={!!viewingScreenshot}
        onOpenChange={() => setViewingScreenshot(null)}
      >
        <DialogContent className="max-w-7xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Screenshot</DialogTitle>
          </DialogHeader>
          {viewingScreenshot && (
            <div className="space-y-4">
              <div className="relative w-full h-[80vh] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={viewingScreenshot.screenshotUrl}
                  alt="Screenshot"
                  className="h-full w-full object-contain"
                  fill
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {viewingScreenshot.influencer?.name} •{" "}
                  {viewingScreenshot.campaign?.title ||
                    viewingScreenshot.campaign?.brandName}
                </div>
                <Button
                  onClick={() =>
                    downloadCampaignAsset(
                      viewingScreenshot.screenshotUrl,
                      viewingScreenshot.campaign?.title ||
                        viewingScreenshot.campaign?.brandName ||
                        "Unknown Campaign",
                      {
                        filename: `${viewingScreenshot.campaign?.title || viewingScreenshot.campaign?.brandName || "campaign"}-screenshot`,
                      },
                    )
                  }
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
