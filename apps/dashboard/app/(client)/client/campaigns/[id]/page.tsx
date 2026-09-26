"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCampaignsControllerFindOne,
  useCampaignsControllerDelete,
  useSubmissionsControllerGetCampaignSubmissions,
  getCampaignsControllerFindAllQueryKey,
} from "@workspace/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  Target,
  Edit,
  Trash2,
  Download,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import VideoPlayerComponent from "@/components/video-player";
import { downloadCampaignAsset } from "@/lib/services/downloadService";
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
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);
  const [sortBy, setSortBy] = useState<"submissionDate" | "views">(
    "submissionDate",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewingScreenshot, setViewingScreenshot] = useState<{
    screenshotUrl: string;
    influencerName: string;
  } | null>(null);

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

  const deleteMutation = useCampaignsControllerDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getCampaignsControllerFindAllQueryKey(),
        });
        router.push("/client/campaigns");
      },
    },
  });

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
            <Link href="/client/campaigns">
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
          <Button variant="outline" asChild>
            <Link href={`/client/campaigns/${campaignId}/edit`}>
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
                      Screenshot
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Influencer ID
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
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <button
                          className="h-14 w-20 rounded-md bg-muted overflow-hidden border border-border/60 block hover:opacity-80 transition-opacity disabled:opacity-40"
                          onClick={() =>
                            (submission as any).screenshotUrl &&
                            setViewingScreenshot({
                              screenshotUrl: (submission as any).screenshotUrl,
                              influencerName:
                                submission.influencer?.name || "Unknown",
                            })
                          }
                          disabled={!(submission as any).screenshotUrl}
                          title={
                            (submission as any).screenshotUrl
                              ? "View screenshot"
                              : "No screenshot"
                          }
                        >
                          {(submission as any).screenshotUrl ? (
                            <Image
                              src={(submission as any).screenshotUrl}
                              alt="Screenshot"
                              className="h-full w-full object-cover"
                              width={80}
                              height={56}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {submission.influencer?.publicInfluencerId ||
                            "Unknown"}
                        </span>
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
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h4>
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

            {c.campaignAsset && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Campaign Asset
                </h4>
                <div className="space-y-3">
                  <div className="relative rounded-lg bg-muted max-w-2xl">
                    {c.campaignAsset.match(/\.(mp4|webm|ogg)$/i) ? (
                      <VideoPlayerComponent src={c.campaignAsset} />
                    ) : (
                      <Image
                        src={c.campaignAsset}
                        alt="Campaign asset"
                        className="w-full h-full object-cover"
                        width={1000}
                        height={1000}
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
      </div>
      {/* Screenshot Modal */}
      <Dialog
        open={!!viewingScreenshot}
        onOpenChange={() => setViewingScreenshot(null)}
      >
        <DialogContent className="max-w-7xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              Screenshot — {viewingScreenshot?.influencerName}
            </DialogTitle>
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
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    downloadCampaignAsset(
                      viewingScreenshot.screenshotUrl,
                      viewingScreenshot.influencerName,
                      {
                        filename: `${viewingScreenshot.influencerName}-screenshot`,
                      },
                    )
                  }
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
