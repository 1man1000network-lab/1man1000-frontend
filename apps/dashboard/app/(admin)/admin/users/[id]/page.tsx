"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUsersControllerFindOne,
  useUsersControllerUpdateStatus,
  useAdminControllerGetInfluencerOverview,
  getUsersControllerFindAllQueryKey,
  getUsersControllerFindOneQueryKey,
  UpdateUserStatusDtoStatus,
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
import { Separator } from "@workspace/ui/components/separator";
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Ban,
  Mail,
  Phone,
  Building2,
  IdCard,
  GraduationCap,
  Briefcase,
  Wallet,
  Eye,
  CreditCard,
  Megaphone,
  FileImage,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { showCountryNameByAlpha3 } from "@/lib/show-country-name";

const FieldRow = ({ label, value }: { label: string; value?: string }) => {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right break-all">
        {value && value.length > 0 ? value : "—"}
      </span>
    </div>
  );
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const { data, isLoading, isError, refetch } =
    useUsersControllerFindOne(userId);
  const user = data;

  const { data: overview } = useAdminControllerGetInfluencerOverview(userId, {
    query: { enabled: user?.role === "influencer" },
  });

  const [viewingScreenshot, setViewingScreenshot] = useState<{
    url: string;
    campaignName: string;
  } | null>(null);
  const updateStatusMutation = useUsersControllerUpdateStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getUsersControllerFindOneQueryKey(userId),
        });
        queryClient.invalidateQueries({
          queryKey: getUsersControllerFindAllQueryKey(),
        });
      },
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({
      id: userId,
      data: { status: UpdateUserStatusDtoStatus.approved },
    });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({
      id: userId,
      data: { status: UpdateUserStatusDtoStatus.rejected },
    });
  };

  const handleSuspend = () => {
    updateStatusMutation.mutate({
      id: userId,
      data: { status: "suspended" as unknown as UpdateUserStatusDtoStatus },
    });
  };

  const handleUnsuspend = () => {
    updateStatusMutation.mutate({
      id: userId,
      data: { status: UpdateUserStatusDtoStatus.approved },
    });
  };

  if (isLoading) return <LoadingState text="Loading user details..." />;

  if (isError || !user) {
    return (
      <ErrorState
        title="Failed to load user"
        message="There was an error loading the user details."
        onRetry={() => refetch()}
      />
    );
  }

  const isInfluencer = user.role === "influencer";
  const isClient = user.role === "client";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {user.name || user.company || "User"}
              </h1>
              <Badge variant="outline" className="capitalize border-border/60">
                {user.role}
              </Badge>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                onClick={handleApprove}
                disabled={updateStatusMutation.isPending}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleReject}
                disabled={updateStatusMutation.isPending}
              >
                <UserX className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {user.status !== "suspended" ? (
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={updateStatusMutation.isPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
              onClick={handleUnsuspend}
              disabled={updateStatusMutation.isPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              Unsuspend
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Email</span>
            </div>
            <FieldRow label="Email" value={user.email} />
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Phone</span>
            </div>
            <FieldRow label="Phone" value={user.phone || undefined} />
            <Separator />
            <FieldRow label="Status" value={user.status} />
            <FieldRow
              label="Profile Completed"
              value={String(!!user.profileCompleted)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isClient && (
              <>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Client</span>
                </div>
                <FieldRow
                  label="Company"
                  value={user.company || user.name || undefined}
                />
              </>
            )}

            {isInfluencer && (
              <>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span>Influencer</span>
                </div>
                <FieldRow
                  label="Public Influencer ID"
                  value={user.publicInfluencerId || undefined}
                />
                <Separator />

                <div className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </div>
                <FieldRow
                  label="Occupation"
                  value={user.occupation || undefined}
                />
                <FieldRow label="Gender" value={user.gender || undefined} />
                <FieldRow
                  label="Age Bracket"
                  value={user.ageBracket || undefined}
                />
                <FieldRow label="Is Student" value={String(!!user.isStudent)} />
                <FieldRow label="School" value={user.schoolName || undefined} />

                <Separator />

                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>Payment</span>
                </div>
                <FieldRow
                  label="Country"
                  value={
                    user.country
                      ? showCountryNameByAlpha3(user.country) || user.country
                      : undefined
                  }
                />
                {user.country === "GHA" ? (
                  <>
                    <FieldRow
                      label="Mobile Money Network"
                      value={user.mobileMoneyNetwork || undefined}
                    />
                    <FieldRow
                      label="Mobile Money Number"
                      value={user.mobileMoneyNumber || undefined}
                    />
                  </>
                ) : user.country ? (
                  <>
                    <FieldRow
                      label="Bank Name"
                      value={user.bankName || undefined}
                    />
                    <FieldRow
                      label="Bank Account Number"
                      value={user.bankAccountNumber || undefined}
                    />
                  </>
                ) : null}
              </>
            )}

            {!isClient && !isInfluencer && (
              <>
                <FieldRow label="Role" value={user.role} />
                <FieldRow label="Company" value={user.company || undefined} />
              </>
            )}

            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>Dates</span>
            </div>
            <FieldRow
              label="Created"
              value={
                user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : undefined
              }
            />
            <FieldRow
              label="Updated"
              value={
                user.updatedAt
                  ? new Date(user.updatedAt).toLocaleString()
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </div>

      {isInfluencer && overview && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Earned
                </CardTitle>
                <CreditCard className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  GH₵{overview.stats.paidEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  GH₵{overview.stats.pendingEarnings.toFixed(2)} pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.stats.totalViews.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  on approved submissions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Campaigns
                </CardTitle>
                <Megaphone className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.stats.campaignsParticipated}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.stats.activeCampaigns} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Submissions
                </CardTitle>
                <FileImage className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.stats.totalSubmissions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.stats.approvedSubmissions} approved ·{" "}
                  {overview.stats.pendingSubmissions} pending ·{" "}
                  {overview.stats.rejectedSubmissions} rejected
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Surveys
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.stats.surveysCompleted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  GH₵{overview.stats.surveyEarnings.toFixed(2)} earned
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submitted Screenshots</CardTitle>
              <CardDescription>
                All submissions — approved, pending and rejected — with views
                and estimated earnings per post
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overview.submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No submissions yet</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {overview.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-lg border overflow-hidden"
                    >
                      {submission.screenshotUrl ? (
                        <img
                          src={submission.screenshotUrl}
                          alt={submission.campaignName}
                          className="h-40 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() =>
                            setViewingScreenshot({
                              url: submission.screenshotUrl!,
                              campaignName: submission.campaignName,
                            })
                          }
                        />
                      ) : (
                        <div className="h-40 w-full bg-muted flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {submission.campaignName}
                          </p>
                          <StatusBadge status={submission.approvalStatus} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {submission.views.toLocaleString()} views
                          </span>
                          <span>
                            GH₵{submission.earnedAmount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            submission.submissionDate,
                          ).toLocaleDateString()}
                        </p>
                        {submission.reviewNotes && (
                          <p className="text-xs text-muted-foreground italic truncate" title={submission.reviewNotes}>
                            {submission.reviewNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns Participated</CardTitle>
                <CardDescription>
                  Campaigns this influencer has been assigned to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overview.campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No campaigns yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overview.campaigns.map((campaign) => (
                      <Link
                        key={campaign.id}
                        href={`/admin/campaigns/${campaign.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {campaign.campaignName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assigned{" "}
                            {new Date(
                              campaign.assignedDate,
                            ).toLocaleDateString()}{" "}
                            · {campaign.submissionsCount} submissions ·{" "}
                            {campaign.views.toLocaleString()} views
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold">
                            GH₵{campaign.earnedAmount.toFixed(2)}
                          </span>
                          <StatusBadge status={campaign.campaignStatus} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>
                  Payment records for this influencer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overview.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No payments yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overview.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {payment.campaignName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.viewsDelivered.toLocaleString()} views ·{" "}
                            {new Date(
                              payment.paymentDate || payment.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold">
                            GH₵{payment.totalAmount.toFixed(2)}
                          </span>
                          <StatusBadge status={payment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog
        open={!!viewingScreenshot}
        onOpenChange={() => setViewingScreenshot(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewingScreenshot?.campaignName || "Submission"} — Screenshot
            </DialogTitle>
          </DialogHeader>
          {viewingScreenshot && (
            <img
              src={viewingScreenshot.url}
              alt="Submission screenshot"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
