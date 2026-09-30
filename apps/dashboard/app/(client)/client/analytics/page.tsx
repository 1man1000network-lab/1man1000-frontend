"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  TrendingUp,
  Eye,
  Users,
  Megaphone,
  Target,
  BarChart3,
} from "lucide-react";
import { useCampaignsControllerGetClientCampaigns } from "@workspace/client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

export default function ClientAnalyticsPage() {
  const {
    data: campaigns,
    isLoading,
    isError,
    refetch,
  } = useCampaignsControllerGetClientCampaigns();

  if (isLoading) return <LoadingState text="Loading analytics..." />;

  if (isError || !campaigns) {
    return (
      <ErrorState
        title="Failed to load analytics"
        message="There was an error loading your analytics data."
        onRetry={() => refetch()}
      />
    );
  }

  // Calculate stats from campaigns
  const totalViews = campaigns.reduce((sum, c) => sum + (c.totalViews || 0), 0);
  const totalCampaigns = campaigns.length;
  const totalInfluencers = campaigns.reduce(
    (sum, c) => sum + (c._count?.assignments || 0),
    0,
  );
  const totalSubmissions = campaigns.reduce(
    (sum, c) => sum + (c._count?.submissions || 0),
    0,
  );
  const avgConversion =
    totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(1) : "0.0";
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  const stats = {
    totalViews,
    totalCampaigns,
    activeInfluencers: totalInfluencers,
    avgConversion: parseFloat(avgConversion),
    totalSpent,
  };

  // Get campaign performance data
  const campaignPerformance = campaigns
    .filter((c) => c.status === "approved")
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.title || campaign.brandName,
      views: campaign.totalViews || 0,
      target: campaign.targetViewRange?.max || 0,
      influencers: campaign._count?.assignments || 0,
      conversion:
        campaign.totalViews > 0
          ? (
              ((campaign._count?.submissions || 0) / campaign.totalViews) *
              100
            ).toFixed(1)
          : "0.0",
    }))
    .slice(0, 5);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your campaign performance and ROI
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalViews.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campaigns
            </CardTitle>
            <Megaphone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Influencers
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInfluencers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConversion}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{stats.totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Compare performance across your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {campaignPerformance.map((campaign) => (
                  <div key={campaign.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{campaign.name as string}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.influencers} influencers
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {campaign.views.toLocaleString()} views
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of {campaign.target.toLocaleString()} target
                          </p>
                        </div>
                        <Badge variant="outline">
                          {campaign.conversion}% CVR
                        </Badge>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-secondary">
                      <div
                        className="h-3 rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((campaign.views / campaign.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Views and conversions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mr-4" />
                Chart placeholder - Performance trends visualization
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
