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
  CreditCard,
  Star,
  ArrowRight,
  Upload,
  Clock,
  ClipboardList,
  Target,
  DollarSign,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useSurveysControllerGetAvailableSurveys,
  useSurveysControllerGetInfluencerStats,
  useCampaignsControllerGetInfluencerCampaigns,
  useCampaignsControllerGetAvailableCampaigns,
  usePaymentsControllerGetInfluencerPayments,
  useUsersControllerGetLeaderboard,
} from "@workspace/client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { isCampaignExpired } from "@/lib/campaign-utils";

export default function InfluencerDashboard() {
  const {
    data: availableSurveysResponse,
    isLoading: isLoadingSurveys,
    isError: isErrorSurveys,
    refetch: refetchSurveys,
  } = useSurveysControllerGetAvailableSurveys();
  const {
    data: surveyStatsResponse,
    isLoading: isLoadingSurveyStats,
    isError: isErrorSurveyStats,
    refetch: refetchSurveyStats,
  } = useSurveysControllerGetInfluencerStats();
  const {
    data: campaignsResponse,
    isLoading: isLoadingMyCampaigns,
    isError: isErrorMyCampaigns,
    refetch: refetchMyCampaigns,
  } = useCampaignsControllerGetInfluencerCampaigns();
  const {
    data: availableCampaignsResponse,
    isLoading: isLoadingAvailableCampaigns,
    isError: isErrorAvailableCampaigns,
    refetch: refetchAvailableCampaigns,
  } = useCampaignsControllerGetAvailableCampaigns({ page: 1, limit: 6 });
  const {
    data: paymentsResponse,
    isLoading: isLoadingPayments,
    isError: isErrorPayments,
    refetch: refetchPayments,
  } = usePaymentsControllerGetInfluencerPayments();
  const {
    data: leaderboardResponse,
    isLoading: isLoadingLeaderboard,
    isError: isErrorLeaderboard,
    refetch: refetchLeaderboard,
  } = useUsersControllerGetLeaderboard({ limit: 10 });

  if (
    isLoadingSurveys ||
    isLoadingSurveyStats ||
    isLoadingMyCampaigns ||
    isLoadingAvailableCampaigns ||
    isLoadingPayments ||
    isLoadingLeaderboard
  ) {
    return <LoadingState text="Loading dashboard..." />;
  }

  if (
    isErrorSurveys ||
    isErrorSurveyStats ||
    isErrorMyCampaigns ||
    isErrorAvailableCampaigns ||
    isErrorPayments ||
    isErrorLeaderboard
  ) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message="There was an error loading your dashboard."
        onRetry={() => {
          refetchSurveys();
          refetchSurveyStats();
          refetchMyCampaigns();
          refetchAvailableCampaigns();
          refetchPayments();
          refetchLeaderboard();
        }}
      />
    );
  }

  const availableSurveys = (availableSurveysResponse || []) as Array<any>;
  const surveyStats = surveyStatsResponse || {
    completedSurveys: 0,
    totalEarnings: 0,
    averageRating: 0,
    inProgressCount: 0,
    availableCount: 0,
  };

  const campaigns = campaignsResponse?.data || [];
  const activeCampaignsCount = campaigns.filter(
    (c) => c.status === "active" || c.status === "approved",
  ).length;

  const availableCampaigns = availableCampaignsResponse?.data || [];
  const availableCampaignsPreview = availableCampaigns.slice(0, 3).map((c) => {
    // Calculate potential earnings using payment tiers
    const tiers = c.paymentTiers || [];
    const targetMin = c.targetViewRange?.min || 0;
    const targetMax = c.targetViewRange?.max || 0;

    // Find the appropriate tier for min and max views
    const getTierAmount = (views: number) => {
      if (tiers.length === 0) return 0;
      // Find tier where views falls within lowerLimit and upperLimit
      const tier = tiers.find(
        (t) =>
          views >= t.lowerLimit &&
          (!t.upperLimit || views <= (t.upperLimit as unknown as number)),
      );
      // If no specific tier found, use the highest tier (last one)
      return tier?.amount || tiers[tiers.length - 1]?.amount || 0;
    };

    // Calculate potential based on target view range and tiers
    const potentialMin = targetMin * getTierAmount(targetMin);
    const potentialMax = targetMax * getTierAmount(targetMax);

    return {
      id: c.id,
      name: c.title || c.brandName,
      brand: c.client?.name || c.brandName,
      paymentTiers: tiers,
      potential: { min: potentialMin, max: potentialMax },
      status: c.status,
      participants: c._count?.assignments ?? 0,
    };
  });

  const activeCampaigns = campaigns
    .filter((c: any) => c.status === "active" || c.status === "approved")
    .slice(0, 3)
    .map((c: any) => {
      const endDate = new Date(c.endDate);
      const now = new Date();
      const daysLeft = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: c.id,
        name: c.title || c.brandName,
        brand: c.brandName,
        deadline: daysLeft > 0 ? `${daysLeft} days left` : "Expired",
        status: c.assignmentStatus || "assigned",
        endDate: c.endDate, // Add original endDate for isCampaignExpired check
        participants: c._count?.assignments ?? 0,
      };
    });

  const payments = (paymentsResponse?.data || []) as Array<any>;
  const earnings = payments
    .filter((p: any) => p.status === "paid")
    .slice(0, 3)
    .map((p: any) => ({
      campaign: p.campaign?.title || p.campaign?.brandName || "Campaign",
      amount: p.totalAmount,
      date: new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }));

  const totalEarnings = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);

  const totalCampaignsParticipated = campaigns.length;

  const stats = [
    {
      title: "Active Campaigns",
      value: activeCampaignsCount.toString(),
      icon: Megaphone,
      color: "text-blue-600",
    },
    {
      title: "Total Campaigns Participated",
      value: totalCampaignsParticipated.toString(),
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Earnings",
      value: `GH₵${totalEarnings.toFixed(2)}`,
      icon: CreditCard,
      color: "text-purple-600",
    },
    // {
    //   title: "Rating",
    //   value: surveyStats.averageRating.toFixed(1),
    //   icon: Star,
    //   color: "text-yellow-600",
    // },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Influencer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track your campaigns and earnings
        </p>
      </div>

      {/* Mobile-first layout - only visible on mobile */}
      <div className="lg:hidden space-y-8">
        {/* Campaigns you're working on - FIRST SECTION (Mobile Only) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Campaigns you're working on</CardTitle>
              <CardDescription>
                Active campaigns and submissions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/campaigns">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No active campaigns</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.brand}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.participants}{" "}
                        {campaign.participants === 1
                          ? "influencer"
                          : "influencers"}{" "}
                        participating
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {campaign.deadline}
                      </span>
                      {!isCampaignExpired(campaign.endDate) ? (
                        <Button size="sm" asChild>
                          <Link
                            href={`/influencer/campaigns/${campaign.id}/submit`}
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            Submit Screenshot
                          </Link>
                        </Button>
                      ) : (
                        <Badge
                          variant={
                            campaign.status === "in_progress" ||
                            campaign.status === "accepted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {campaign.status.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Campaigns - SECOND SECTION (Mobile Only) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Available Campaigns</CardTitle>
              <CardDescription>New campaigns you can join</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/campaigns/available">
                Browse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {availableCampaignsPreview.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No campaigns available right now</p>
                <p className="text-xs mt-1">
                  Check back soon for new opportunities.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableCampaignsPreview.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {campaign.name as string}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.brand as string}
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {campaign.paymentTiers &&
                          campaign.paymentTiers.length > 0 ? (
                            <>
                              Up to GH₵
                              {Number(
                                campaign.paymentTiers[
                                  campaign.paymentTiers.length - 1
                                ]?.amount || 0,
                              ).toFixed(3)}
                            </>
                          ) : (
                            "Tiered pricing"
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.participants}{" "}
                          {campaign.participants === 1
                            ? "influencer"
                            : "influencers"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" asChild>
                        <Link
                          href={`/influencer/campaigns/available/${campaign.id}`}
                        >
                          Participate
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Surveys - THIRD SECTION (Mobile Only) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Available Surveys</CardTitle>
              <CardDescription>
                Complete surveys to earn extra income
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/surveys">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {availableSurveys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No surveys available at the moment</p>
                <p className="text-xs mt-1">
                  Check back later for new opportunities!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {availableSurveys.slice(0, 3).map((survey: any) => (
                  <div
                    key={survey.id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600">
                        GH₵{survey.paymentPerResponse || 0}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {survey._count?.questions || 0} questions
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {survey.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {survey.client?.name || "Anonymous Client"}
                      </p>
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/influencer/surveys/${survey.id}/take`}>
                        Start Survey
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop layout - original layout for desktop and larger screens */}
      <div className="hidden lg:block space-y-8">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Surveys
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {surveyStats.completedSurveys}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                GH₵{surveyStats.totalEarnings} earned
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Campaigns you're working on</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/influencer/campaigns">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No active campaigns</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.brand}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.participants}{" "}
                          {campaign.participants === 1
                            ? "influencer"
                            : "influencers"}{" "}
                          participating
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {campaign.deadline}
                        </span>

                        {!isCampaignExpired(campaign.endDate) ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/influencer/campaigns/${campaign.id}/submit`}
                            >
                              <Upload className="mr-1 h-3 w-3" />
                              Submit Screenshot
                            </Link>
                          </Button>
                        ) : (
                          <Badge
                            variant={
                              campaign.status === "in_progress" ||
                              campaign.status === "accepted"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {campaign.status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Available Campaigns</CardTitle>
                <CardDescription>New campaigns you can join</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/influencer/campaigns/available">
                  Browse
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {availableCampaignsPreview.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No campaigns available right now</p>
                  <p className="text-xs mt-1">
                    Check back soon for new opportunities.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableCampaignsPreview.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {campaign.name as string}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.brand as string}
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {campaign.paymentTiers &&
                            campaign.paymentTiers.length > 0 ? (
                              <>
                                Up to GH₵
                                {Number(
                                  campaign.paymentTiers[
                                    campaign.paymentTiers.length - 1
                                  ]?.amount || 0,
                                ).toFixed(3)}
                              </>
                            ) : (
                              "Tiered pricing"
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.participants}{" "}
                            {campaign.participants === 1
                              ? "influencer"
                              : "influencers"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/influencer/campaigns/available/${campaign.id}`}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your payment history</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/earnings">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No earnings yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {earnings.map((earning, index) => (
                    <div
                      key={`${earning.campaign}-${index}`}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {earning.campaign}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {earning.date}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        +GH₵{earning.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Earnings</span>
                    <span className="text-lg font-bold">
                      GH₵{totalEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Available Surveys</CardTitle>
              <CardDescription>
                Complete surveys to earn extra income
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/surveys">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {availableSurveys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No surveys available at the moment</p>
                <p className="text-xs mt-1">
                  Check back later for new opportunities!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {availableSurveys.slice(0, 3).map((survey: any) => (
                  <div
                    key={survey.id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600">
                        GH₵{survey.paymentPerResponse || 0}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {survey._count?.questions || 0} questions
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {survey.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {survey.client?.name || "Anonymous Client"}
                      </p>
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/influencer/surveys/${survey.id}/take`}>
                        Start Survey
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile earnings section - shown after main mobile sections */}
      <div className="lg:hidden">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your payment history</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencer/earnings">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No earnings yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {earnings.map((earning, index) => (
                    <div
                      key={`${earning.campaign}-${index}`}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {earning.campaign}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {earning.date}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        +GH₵{earning.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Earnings</span>
                    <span className="text-lg font-bold">
                      GH₵{totalEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile stats section - shown last on mobile */}
      <div className="lg:hidden">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Surveys
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {surveyStats.completedSurveys}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                GH₵{surveyStats.totalEarnings} earned
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leaderboard - visible on all screen sizes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            Leaderboard
          </CardTitle>
          <CardDescription>
            Top influencers ranked by approved views
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(leaderboardResponse?.entries || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No rankings yet</p>
              <p className="text-xs mt-1">
                Be the first — submit screenshots and rack up views!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardResponse!.entries.map((entry) => (
                <div
                  key={entry.influencerId}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    entry.isCurrentUser
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      entry.rank === 1
                        ? "bg-yellow-400 text-yellow-900"
                        : entry.rank === 2
                          ? "bg-gray-300 text-gray-700"
                          : entry.rank === 3
                            ? "bg-amber-600 text-white"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="ml-2 text-xs font-semibold text-primary">
                          You
                        </span>
                      )}
                    </p>
                    {entry.publicInfluencerId && (
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.publicInfluencerId}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {entry.totalViews.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.submissionsCount} submissions
                    </p>
                  </div>
                </div>
              ))}
              {leaderboardResponse?.currentUserRank &&
                leaderboardResponse.currentUserRank >
                  leaderboardResponse.entries.length && (
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {leaderboardResponse.currentUserRank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Your rank
                          <span className="ml-2 text-xs font-semibold text-primary">
                            You
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Keep submitting to climb the board!
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          {(
                            leaderboardResponse.currentUserViews || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
