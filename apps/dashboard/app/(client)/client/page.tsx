"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Megaphone,
  Eye,
  FileImage,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useCampaignsControllerGetDashboardStats } from "@workspace/client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

export default function ClientDashboard() {
  const { data, isLoading, isError, refetch } =
    useCampaignsControllerGetDashboardStats();

  if (isLoading) return <LoadingState text="Loading dashboard..." />;

  if (isError || !data) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message="There was an error loading your dashboard data."
        onRetry={() => refetch()}
      />
    );
  }

  const stats = [
    {
      title: "Active Campaigns",
      value: data.stats.activeCampaigns.toString(),
      icon: Megaphone,
      color: "text-blue-600",
    },
    {
      title: "Total Views",
      value: data.stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-green-600",
    },
    {
      title: "Submissions",
      value: data.stats.submissions.toString(),
      icon: FileImage,
      color: "text-orange-600",
    },
    {
      title: "Conversion Rate",
      value: data.stats.conversionRate,
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  const totalCampaigns = data.stats.totalCampaigns;
  console.log(totalCampaigns, "totalCampaigns");
  const activeCampaigns = data.stats.activeCampaigns;
  const totalViews = data.stats.totalViews;
  const totalSubmissions = data.stats.submissions;

  const campaignInvestment = data.stats.campaignInvestment;

  const formatGhs = (amount: number) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      maximumFractionDigits: 2,
    }).format(amount);

  const avgViewsPerSubmission =
    totalSubmissions > 0 ? Math.round(totalViews / totalSubmissions) : null;

  const viewsPerActiveCampaign =
    activeCampaigns > 0 ? Math.round(totalViews / activeCampaigns) : null;

  const activeCampaignRate =
    typeof totalCampaigns === "number" && totalCampaigns > 0
      ? Math.round((activeCampaigns / totalCampaigns) * 100)
      : null;

  const avgCampaignProgress =
    data.recentCampaigns.length > 0
      ? Math.round(
          data.recentCampaigns.reduce((sum, campaign) => {
            const targetMax = (campaign.targetViewRange?.max || 1) as number;
            const progress = (campaign.totalViews / targetMax) * 100;
            return sum + Math.min(progress, 100);
          }, 0) / data.recentCampaigns.length,
        )
      : null;

  const submissionsPer1kViews =
    totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 1000) : null;

  const costPerView =
    campaignInvestment !== null && totalViews > 0
      ? campaignInvestment / totalViews
      : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Client Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your campaigns and track performance
          </p>
        </div>
        <Button asChild>
          <Link href="/client/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Views / Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgViewsPerSubmission === null
                ? "—"
                : avgViewsPerSubmission.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views / Active Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {viewsPerActiveCampaign === null
                ? "—"
                : viewsPerActiveCampaign.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaign Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCampaignRate === null ? "—" : `${activeCampaignRate}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Campaign Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCampaignProgress === null ? "—" : `${avgCampaignProgress}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Insights</CardTitle>
            <CardDescription>
              Quick unit-economics from your campaign activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Submissions per 1,000 views
                </span>
                <span className="text-sm font-medium">
                  {submissionsPer1kViews === null ? "—" : submissionsPer1kViews}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Recent campaigns shown
                </span>
                <span className="text-sm font-medium">
                  {data.recentCampaigns.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Recent submissions shown
                </span>
                <span className="text-sm font-medium">
                  {data.recentSubmissions.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI Overview</CardTitle>
            <CardDescription>
              High-level investment and reach (ROI requires spend/value inputs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Campaign Investment
                </span>
                <span className="text-sm font-medium">
                  {campaignInvestment === null
                    ? "—"
                    : formatGhs(campaignInvestment)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Reach (Views)
                </span>
                <span className="text-sm font-medium">
                  {totalViews.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Cost / View
                </span>
                <span className="text-sm font-medium">
                  {costPerView === null ? "—" : formatGhs(costPerView)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Submissions
                </span>
                <span className="text-sm font-medium">
                  {totalSubmissions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">
                  Efficiency (Views / Submission)
                </span>
                <span className="text-sm font-semibold">
                  {avgViewsPerSubmission === null
                    ? "—"
                    : avgViewsPerSubmission.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Campaigns</CardTitle>
              <CardDescription>Track your active campaigns</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/client/campaigns">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentCampaigns.length > 0 ? (
                data.recentCampaigns.map((campaign) => {
                  const targetMax = (campaign.targetViewRange?.max ||
                    1) as number;
                  const progress = (campaign.totalViews / targetMax) * 100;

                  return (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {campaign.title || campaign.brandName}
                        </span>
                        <Badge
                          variant={
                            campaign.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {campaign.totalViews.toLocaleString()} /{" "}
                        {targetMax.toLocaleString()} views
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No campaigns yet. Create your first campaign to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest influencer submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentSubmissions.length > 0 ? (
                data.recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                      {(submission.influencer?.id || "INF")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {submission.influencer?.id || "Unknown Influencer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.campaign?.title ||
                          submission.campaign?.brandName}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {submission.approvalStatus === "reversed"
                        ? "rejected"
                        : submission.approvalStatus}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No submissions yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
