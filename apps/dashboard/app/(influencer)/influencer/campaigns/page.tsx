"use client";

import { useState } from "react";
import Link from "next/link";
import { CampaignAssetModal } from "@/components/campaign-asset-modal";
import { useCampaignsControllerGetInfluencerCampaigns } from "@workspace/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Eye,
  Clock,
  Search,
  Target,
  Upload,
  CheckCircle,
  ArrowUpDown,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { isCampaignExpired } from "@/lib/campaign-utils";
import Image from "next/image";

export default function InfluencerCampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("assignedDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useCampaignsControllerGetInfluencerCampaigns({
    page,
    limit,
    sortBy,
    sortOrder,
  });
  const campaigns = response?.data || [];

  const activeCampaigns = campaigns.filter(
    (c) =>
      c.assignmentStatus === "accepted" ||
      c.assignmentStatus === "pending" ||
      c.assignmentStatus === "assigned" ||
      (c.assignmentStatus === "completed" && !isCampaignExpired(c.endDate)),
  );
  const completedCampaigns = campaigns.filter(
    (c) => c.assignmentStatus === "completed" && isCampaignExpired(c.endDate),
  );

  const filteredCampaigns = (
    activeTab === "active" ? activeCampaigns : completedCampaigns
  ).filter(
    (campaign) =>
      campaign.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.title as any)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (campaign.description as any)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

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
      <div className="flex items-center justify-between md:flex-row flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Campaigns
          </h1>
          <p className="text-muted-foreground">
            View and manage your assigned campaigns
          </p>
        </div>
        <Button asChild className="md:w-auto w-full">
          <Link href="/influencer/campaigns/available">
            <Target className="h-4 w-4 mr-2" />
            Browse Available Campaigns
          </Link>
        </Button>
      </div>

      {response?.meta && (
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-muted-foreground">Rows</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {response.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(response.meta!.totalPages!, p + 1))
            }
            disabled={page === response.meta!.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {activeCampaigns.length}
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
              {completedCampaigns.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assignedDate">Assigned Date</SelectItem>
            <SelectItem value="views">Views Count</SelectItem>
            <SelectItem value="brandName">Brand Name</SelectItem>
            <SelectItem value="endDate">End Date</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
        >
          {sortOrder === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active
            {activeCampaigns.length > 0 && (
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-600 border-0">
                {activeCampaigns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {activeTab === "active"
                    ? "You don't have any active campaigns assigned yet."
                    : "No completed campaigns yet."}
                </p>
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
                      {/* <StatusBadge status={campaign.status} /> */}

                      {campaign.hasSubmitted && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Submitted ({campaign.submissionCount})</span>
                        </div>
                      )}
                    </div>
                    <CardDescription>{campaign.brandName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.campaignAsset && (
                      <div
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          setSelectedAsset({
                            url: campaign.campaignAsset as any,
                            title:
                              (campaign.title as any) || campaign.brandName,
                          })
                        }
                      >
                        {(campaign.campaignAsset as any).match(
                          /\.(mp4|webm|ogg)$/i,
                        ) ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-black/80">
                            <video
                              src={campaign.campaignAsset as any}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-3">
                                <svg
                                  className="w-8 h-8 text-black"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Image
                            src={campaign.campaignAsset as any}
                            alt="Campaign asset"
                            className="w-full h-full object-cover"
                            width={500}
                            height={500}
                          />
                        )}
                      </div>
                    )}
                    {/* <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          Target Views
                        </p>
                        <p className="text-sm font-semibold">
                          {campaign.targetViewRange?.min?.toLocaleString()} -{" "}
                          {campaign.targetViewRange?.max?.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          Rate per View
                        </p>
                        <p className="text-sm font-semibold text-emerald-600">
                          GH₵{campaign.ratePerView?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div> */}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                      {(campaign as any).hasSubmitted && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>
                            Submitted ({(campaign as any).submissionCount})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/influencer/campaigns/${campaign.id}`}>
                          <Eye className="mr-1.5 h-4 w-4" />
                          Details
                        </Link>
                      </Button>
                      {!isCampaignExpired(campaign.endDate) ? (
                        <Button size="sm" className="flex-1" asChild>
                          <Link
                            href={`/influencer/campaigns/${campaign.id}/submit`}
                          >
                            <Upload className="mr-1.5 h-4 w-4" />
                            Submit
                          </Link>
                        </Button>
                      ) : campaign.status === "completed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-emerald-600"
                          disabled
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Completed
                        </Button>
                      ) : isCampaignExpired(campaign.endDate) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-muted-foreground"
                          disabled
                        >
                          <Clock className="mr-1.5 h-4 w-4" />
                          Expired
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedAsset && (
        <CampaignAssetModal
          assetUrl={selectedAsset.url}
          campaignTitle={selectedAsset.title}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
