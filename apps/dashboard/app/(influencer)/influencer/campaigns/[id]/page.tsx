"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CampaignAssetModal } from "@/components/campaign-asset-modal";
import { useCampaignsControllerFindOne } from "@workspace/client";
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
  Building2,
  Upload,
  Clock,
  Download,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { ShareCampaignButton } from "@/components/share-campaign-button";
import VideoPlayerComponent from "@/components/video-player";
import { downloadCampaignAsset } from "@/lib/services/downloadService";
import { isCampaignExpired } from "@/lib/campaign-utils";

const statusColors = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  paused: "bg-orange-100 text-orange-800",
  completed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  approved: "bg-green-100 text-green-800",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useCampaignsControllerFindOne(campaignId);
  const campaign = response;

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

  const isExpired = isCampaignExpired(campaign.endDate);

  const handleCopyDescription = async () => {
    if (campaign.description) {
      try {
        await navigator.clipboard.writeText(campaign.description);
        setCopiedDescription(true);
        // Reset after 2 seconds
        setTimeout(() => setCopiedDescription(false), 2000);
      } catch (err) {
        console.error("Failed to copy description:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/influencer/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {campaign.title || campaign.brandName}
              </h1>
              <Badge
                className={
                  statusColors[campaign.status as keyof typeof statusColors] ||
                  "bg-gray-100 text-gray-800"
                }
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {campaign.client?.company ||
                campaign.client?.name ||
                campaign.brandName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareCampaignButton
            campaignId={campaignId}
            campaignTitle={campaign.title || campaign.brandName}
            size="lg"
          />
          {isExpired ? (
            <Button size="lg" disabled variant="secondary">
              <Clock className="h-4 w-4 mr-2" />
              Campaign Expired
            </Button>
          ) : campaign.status === "paused" ? (
            <Button size="lg" disabled variant="secondary">
              <Clock className="h-4 w-4 mr-2" />
              Campaign Paused
            </Button>
          ) : campaign.status !== "approved" ? (
            <Button size="lg" disabled variant="secondary">
              <Clock className="h-4 w-4 mr-2" />
              Not Accepting Submissions
            </Button>
          ) : (
            <Button size="lg" asChild>
              <Link href={`/influencer/campaigns/${campaignId}/submit`}>
                <Upload className="h-4 w-4 mr-2" />
                Submit Work
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.description && (
            <div>
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
              </div>
              <div className="flex items-start gap-2">
                <p className="text-sm">{campaign.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyDescription}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  {copiedDescription ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Target Audience
              </h3>
              <p className="text-sm">{campaign.targetAudience}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Industry
              </h3>
              <p className="text-sm">{campaign.industry}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Submission Deadline
              </h3>
              <p className="text-sm">
                {new Date(campaign.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                {new Date(campaign.endDate).toLocaleDateString()}
              </span>
            </div>
            {campaign._count && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{campaign._count.assignments} influencers assigned</span>
              </div>
            )}
            {campaign.client?.company && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span>{campaign.client.company}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {campaign.paymentTiers && campaign.paymentTiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Payment Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Earn based on your performance. The more views your submission
                gets, the higher your payout.
              </p>
              <div className="grid gap-3">
                {campaign.paymentTiers.map((tier: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {tier.lowerLimit.toLocaleString()} -{" "}
                          {tier.upperLimit
                            ? tier.upperLimit.toLocaleString()
                            : "+"}{" "}
                          views
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tier {index + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        GH₵{tier.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tier.upperLimit
                          ? `for ${tier.upperLimit - tier.lowerLimit + 1} views`
                          : "and above"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.campaignAsset && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg bg-muted">
                {campaign.campaignAsset.match(/\.(mp4|webm|ogg)$/i) ? (
                  <VideoPlayerComponent src={campaign.campaignAsset} />
                ) : (
                  <img
                    src={campaign.campaignAsset}
                    alt="Campaign asset"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCampaignAsset(
                    campaign.campaignAsset!,
                    campaign.title || campaign.brandName,
                    {
                      onError: (err) => {
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
          </CardContent>
        </Card>
      )}

      {campaign.adCreatives && campaign.adCreatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ad Creatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {campaign.adCreatives.map((url, index) => (
                <div
                  key={index}
                  className="aspect-video rounded-lg border overflow-hidden bg-muted"
                >
                  <img
                    src={url}
                    alt={`Ad creative ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-emerald-900">Ready to submit?</p>
              <p className="text-sm text-emerald-700">
                Once you have completed the campaign requirements and have your
                view count screenshot ready, click the &quot;Submit Work&quot;
                button to submit your work for review and earn your rewards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {campaign.campaignAsset && showAssetModal && (
        <CampaignAssetModal
          assetUrl={campaign.campaignAsset}
          campaignTitle={campaign.title || campaign.brandName}
          isOpen={showAssetModal}
          onClose={() => setShowAssetModal(false)}
        />
      )}
    </div>
  );
}
