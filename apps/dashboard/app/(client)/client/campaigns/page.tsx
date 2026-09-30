"use client";

import { useState } from "react";
import Link from "next/link";
import { useCampaignsControllerGetClientCampaigns } from "@workspace/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Progress } from "@workspace/ui/components/progress";
import { Search, Plus, Eye, Users, Edit } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

export default function ClientCampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useCampaignsControllerGetClientCampaigns();
  const campaigns = response || [];

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.title as any)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      campaign.status === activeTab ||
      (activeTab === "active" && campaign.status === "approved");
    return matchesSearch && matchesTab;
  });

  const activeCount = campaigns.filter(
    (c) => c.status === "approved",
  ).length;
  const pendingCount = campaigns.filter((c) => c.status === "pending").length;
  const completedCount = campaigns.filter(
    (c) => c.status === "completed",
  ).length;

  if (isLoading) {
    return <LoadingState text="Loading your campaigns..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load campaigns"
        message="There was an error loading your campaigns. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Campaigns
          </h1>
          <p className="text-muted-foreground">
            Create and manage your marketing campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/client/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
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
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {completedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all"
                    ? "You haven't created any campaigns yet."
                    : `No ${activeTab} campaigns found.`}
                </p>
                <Button asChild>
                  <Link href="/client/campaigns/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {(campaign.title as any) || campaign.brandName}
                      </CardTitle>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <CardDescription>
                      {campaign.brandName} • Created{" "}
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Views Progress
                        </span>
                        <span className="font-medium">
                          {campaign.totalViews?.toLocaleString() || 0} /{" "}
                          {campaign.targetViewRange?.max?.toLocaleString() || 0}
                        </span>
                      </div>
                      <Progress
                        value={
                          campaign.targetViewRange?.max
                            ? ((campaign.totalViews || 0) /
                                campaign.targetViewRange.max) *
                              100
                            : 0
                        }
                        className="h-2.5"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {campaign._count?.assignments || 0} influencers
                      </div>
                      <div className="font-semibold">
                        GH₵{campaign.budget?.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/client/campaigns/${campaign.id}`}>
                          <Eye className="mr-1.5 h-4 w-4" />
                          Analytics
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/client/campaigns/${campaign.id}/edit`}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
