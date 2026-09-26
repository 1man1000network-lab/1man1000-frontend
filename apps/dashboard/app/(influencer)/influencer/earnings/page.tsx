"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  Wallet,
} from "lucide-react";
import {
  usePaymentsControllerGetInfluencerEarnings,
  usePaymentsControllerGetInfluencerPayments,
  useAuthControllerGetProfile,
  type PaymentResponseDto,
  type InfluencerEarningsResponseDto,
  type ProfileResponseDto,
} from "@workspace/client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { showCountryNameByAlpha3 } from "@/lib/show-country-name";
import { ListPaginationWrapper } from "@/components/ui/list-pagination-wrapper";

export default function InfluencerEarningsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: earningsSummary,
    isLoading: isLoadingEarnings,
    isError: isErrorEarnings,
    refetch: refetchEarnings,
  } = usePaymentsControllerGetInfluencerEarnings();

  const {
    data: paymentsResponse,
    isLoading: isLoadingPayments,
    isError: isErrorPayments,
    refetch: refetchPayments,
  } = usePaymentsControllerGetInfluencerPayments({
    page,
    limit,
  });

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
    refetch: refetchProfile,
  } = useAuthControllerGetProfile({
    query: { staleTime: 15_000 },
  });

  if (isLoadingEarnings || isLoadingPayments || isLoadingProfile) {
    return <LoadingState text="Loading earnings..." />;
  }

  if (isErrorEarnings || isErrorPayments || isErrorProfile) {
    return (
      <ErrorState
        title="Failed to load earnings"
        message="There was an error loading your earnings and payment history."
        onRetry={() => {
          refetchEarnings();
          refetchPayments();
          refetchProfile();
        }}
      />
    );
  }

  const typedEarningsSummary = earningsSummary as
    | InfluencerEarningsResponseDto
    | undefined;
  const typedPayments = (paymentsResponse?.data || []) as PaymentResponseDto[];
  const paymentsMeta = paymentsResponse?.meta;
  const typedProfile = profile as ProfileResponseDto | undefined;

  const totalEarnings = typedEarningsSummary?.totalEarnings ?? 0;
  const pendingPaymentsAmount = typedEarningsSummary?.pendingEarnings ?? 0;
  const paidEarnings = typedEarningsSummary?.paidEarnings ?? 0;
  const totalPayments = typedEarningsSummary?.totalPayments ?? 0;

  const paymentsWithCampaign = typedPayments.map((p) => {
    const campaignName = p.campaign?.brandName || "Campaign";
    const dateSource = p.paymentDate || p.createdAt;
    const date = dateSource ? new Date(dateSource).toLocaleDateString() : "";
    return {
      id: p.id,
      campaign: campaignName,
      amount: p.totalAmount,
      status: p.status,
      date,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Track your earnings and payment history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{pendingPaymentsAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Earnings
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{paidEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ListPaginationWrapper
              data={paymentsWithCampaign}
              ListItem={({ item: earning }) => (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{earning.campaign}</p>
                    <p className="text-xs text-muted-foreground">
                      {earning.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${earning.status === "paid" ? "text-green-600" : "text-yellow-600"}`}
                    >
                      GH₵{earning.amount.toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        earning.status === "paid" ? "default" : "secondary"
                      }
                    >
                      {earning.status === "paid" ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" /> Paid
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" /> Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              )}
              isLoading={isLoadingPayments}
              emptyMessage="No payments yet. When you receive payments, they will show up here."
              meta={paymentsMeta}
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

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              {typedProfile?.country === "GHA" || !typedProfile?.country
                ? "Your mobile money details"
                : "Your bank account details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              {typedProfile?.country === "GHA" || !typedProfile?.country ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Network
                    </span>
                    <span className="text-sm font-medium">
                      {typedProfile?.mobileMoneyNetwork || "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Phone Number
                    </span>
                    <span className="text-sm font-medium">
                      {typedProfile?.mobileMoneyNumber || "Not set"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Country
                    </span>
                    <span className="text-sm font-medium">
                      {typedProfile?.country
                        ? showCountryNameByAlpha3(typedProfile.country) ||
                          typedProfile.country
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Bank Name
                    </span>
                    <span className="text-sm font-medium">
                      {typedProfile?.bankName || "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Account Number
                    </span>
                    <span className="text-sm font-medium">
                      {typedProfile?.bankAccountNumber || "Not set"}
                    </span>
                  </div>
                </>
              )}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/settings">Update Payment Details</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
