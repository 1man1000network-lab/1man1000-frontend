"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSubmissionsControllerFindAll,
  useSubmissionsControllerReview,
  useSubmissionsControllerGetStats,
  useSubmissionsControllerReverseApproval,
  getSubmissionsControllerFindAllQueryKey,
  getSubmissionsControllerGetStatsQueryKey,
  ReviewSubmissionDtoApprovalStatus,
} from "@workspace/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Download,
  ImageIcon,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListPaginationWrapper } from "@/components/ui/list-pagination-wrapper";
import Image from "next/image";
import Link from "next/link";
import { downloadCampaignAsset } from "@/lib/services/downloadService";

type Submission = {
  id: string;
  campaignId: string;
  influencerId: string;
  campaign?: { id: string; brandName: string; title?: string };
  influencer?: { id: string; name: string; email: string; avatarUrl?: string };
  screenshotUrl: string;
  extractedViewCount: number;
  verifiedViewCount?: number;
  approvalStatus: string;
  reviewNote?: string;
  createdAt: string;
  isDuplicate?: boolean;
  submissionCount?: number;
  duplicateSubmissionIds?: string[];
};

interface SubmissionListItemProps {
  item: Submission;
  onApprove: (submission: Submission) => void;
  onReject: (submission: Submission) => void;
  onReverseApproval: (submission: Submission) => void;
  onViewScreenshot: (submission: Submission) => void;
  isPending: boolean;
}

function SubmissionListItem({
  item: submission,
  onApprove,
  onReject,
  onReverseApproval,
  onViewScreenshot,
  isPending,
}: SubmissionListItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 ${
        submission.isDuplicate ? "bg-orange-50/50" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-28 rounded-lg bg-muted overflow-hidden border border-border/60">
          {submission.screenshotUrl ? (
            <Image
              src={submission.screenshotUrl}
              alt="Screenshot"
              className="h-full w-full object-cover"
              width={100}
              height={100}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">
            {submission.campaign?.title ||
              submission.campaign?.brandName ||
              "Unknown Campaign"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Link
              href={
                submission.influencer?.id
                  ? `/admin/users/${submission.influencer.id}`
                  : "#"
              }
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={submission.influencer?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-[10px]">
                  {submission.influencer?.name?.slice(0, 2).toUpperCase() ||
                    "??"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground hover:underline">
                {submission.influencer?.name || "Unknown"}
              </p>
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
          {submission.isDuplicate && (
            <p className="text-xs text-orange-600 mt-1">
              {submission.submissionCount || 1} submissions total
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(submission.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-bold">
            {(typeof submission.verifiedViewCount === "number"
              ? submission.verifiedViewCount
              : submission.extractedViewCount || 0
            ).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">views</p>
        </div>
        <StatusBadge status={submission.approvalStatus} />
        <div className="flex items-center gap-2">
          {submission.screenshotUrl && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onViewScreenshot(submission)}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          )}
          {submission.approvalStatus === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => onApprove(submission)}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-red-200 hover:bg-red-50"
                onClick={() => onReject(submission)}
                disabled={isPending}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {submission.approvalStatus === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => onReverseApproval(submission)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Reverse
                </>
              )}
            </Button>
          )}
          {submission.approvalStatus === "reversed" && (
            <div className="text-sm text-muted-foreground">Reversed</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);
  const [reviewingSubmission, setReviewingSubmission] =
    useState<Submission | null>(null);
  const [approvingSubmission, setApprovingSubmission] =
    useState<Submission | null>(null);
  const [reversingSubmission, setReversingSubmission] =
    useState<Submission | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<Submission | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState("");
  const [verifiedViews, setVerifiedViews] = useState<string>("");
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useSubmissionsControllerFindAll({
    page,
    limit,
    approvalStatus: activeTab === "all" ? undefined : activeTab,
    search: debouncedSearch || undefined,
  });
  const submissions = (response?.data || []) as Submission[];

  // Get status counts from dedicated stats endpoint
  const { data: statsData } = useSubmissionsControllerGetStats();
  const pendingCount = statsData?.pending || 0;
  const approvedCount = statsData?.approved || 0;
  const rejectedCount = statsData?.rejected || 0;
  const totalCount = statsData?.total || 0;

  const reviewMutation = useSubmissionsControllerReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getSubmissionsControllerFindAllQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getSubmissionsControllerGetStatsQueryKey(),
        });
        setReviewingSubmission(null);
        setApprovingSubmission(null);
        setReviewNote("");
        setVerifiedViews("");
      },
    },
  });

  const reverseApprovalMutation = useSubmissionsControllerReverseApproval({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getSubmissionsControllerFindAllQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getSubmissionsControllerGetStatsQueryKey(),
        });
        setReversingSubmission(null);
        setReviewNote("");
      },
    },
  });


  const handleReverseApproval = (submission: Submission) => {
    setReversingSubmission(submission);
  };

  const handleApprove = (submission: Submission) => {
    setApprovingSubmission(submission);
    setVerifiedViews(
      String(
        typeof submission.verifiedViewCount === "number"
          ? submission.verifiedViewCount
          : submission.extractedViewCount || 0,
      ),
    );
  };

  const confirmApprove = () => {
    if (!approvingSubmission) return;

    const parsed = Number(verifiedViews);
    const verifiedViewCount =
      Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;

    reviewMutation.mutate({
      id: approvingSubmission.id,
      data: {
        approvalStatus: ReviewSubmissionDtoApprovalStatus.approved,
        reviewNotes: reviewNote,
        ...(typeof verifiedViewCount === "number" ? { verifiedViewCount } : {}),
      },
    });
  };

  const handleReject = (submission: Submission) => {
    setReviewingSubmission(submission);
  };

  const handleViewScreenshot = (submission: Submission) => {
    setViewingScreenshot(submission);
  };

  const confirmReject = () => {
    if (reviewingSubmission) {
      reviewMutation.mutate({
        id: reviewingSubmission.id,
        data: {
          approvalStatus: ReviewSubmissionDtoApprovalStatus.rejected,
          reviewNotes: reviewNote,
        },
      });
    }
  };

  const confirmReverseApproval = () => {
    if (reversingSubmission) {
      reverseApprovalMutation.mutate({
        id: reversingSubmission.id,
        data: {
          reason: reviewNote || "Approval reversed",
        },
      });
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading submissions..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load submissions"
        message="There was an error loading the submissions. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Submissions
        </h1>
        <p className="text-muted-foreground">
          Review and approve influencer submissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {approvedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-yellow-500/15 text-yellow-600 border-0">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="reversed">Reversed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Review</CardTitle>
              <CardDescription>
                {response?.meta?.total ?? 0} submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListPaginationWrapper
                data={submissions}
                ListItem={(props) => (
                  <SubmissionListItem
                    {...props}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onReverseApproval={handleReverseApproval}
                    onViewScreenshot={handleViewScreenshot}
                    isPending={
                      reviewMutation.isPending ||
                      reverseApprovalMutation.isPending
                    }
                  />
                )}
                isLoading={isLoading}
                emptyMessage="No submissions found"
                meta={response?.meta}
                page={page}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!reviewingSubmission}
        onOpenChange={() => setReviewingSubmission(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNote">Rejection Reason</Label>
              <textarea
                id="reviewNote"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="flex min-h-[100px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-border focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewingSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!approvingSubmission}
        onOpenChange={(open) => {
          if (!open) setApprovingSubmission(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Enter the verified view count to use for campaign totals and
              influencer payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verifiedViews">Verified Views</Label>
              <Input
                id="verifiedViews"
                value={verifiedViews}
                onChange={(e) => setVerifiedViews(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 1250"
              />
              <p className="text-xs text-muted-foreground">
                Screenshot extracted views:{" "}
                {approvingSubmission?.extractedViewCount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approveNote">Approval Note (optional)</Label>
              <textarea
                id="approveNote"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note for the influencer/client..."
                className="flex min-h-[100px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-border focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovingSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reversingSubmission}
        onOpenChange={(open) => {
          if (!open) setReversingSubmission(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Approval</DialogTitle>
            <DialogDescription>
              This will reverse the approval and remove the verified views from
              the campaign total.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reverseReason">Reason for Reversal</Label>
              <textarea
                id="reverseReason"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter reason for reversal..."
                className="flex min-h-[100px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-border focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action will:
              </p>
              <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                <li>
                  Remove{" "}
                  {reversingSubmission?.verifiedViewCount ||
                    reversingSubmission?.extractedViewCount ||
                    0}{" "}
                  views from campaign total
                </li>
                <li>Recalculate or remove payment for this submission</li>
                <li>
                  Change influencer assignment status back to
                  &quot;assigned&quot;
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReversingSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReverseApproval}
              disabled={reverseApprovalMutation.isPending}
            >
              {reverseApprovalMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reverse Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="flex justify-end">
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
