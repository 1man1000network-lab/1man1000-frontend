"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  usePaymentsControllerFindAll,
  usePaymentsControllerUpdate,
  usePaymentsControllerUpdateStatus,
  usePaymentsControllerGetAdminStats,
  useCampaignsControllerFindAll,
  paymentsControllerExportPaymentsToCsv,
  type PaymentResponseDto,
  type UpdatePaymentStatusDto,
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
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  Download,
  Pencil,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { ListPaginationWrapper } from "@/components/ui/list-pagination-wrapper";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
};

type Payment = PaymentResponseDto;

interface PaymentListItemProps {
  item: Payment;
  onMarkPaid: (payment: Payment) => void;
  onEditAmount: (payment: Payment) => void;
  isUpdatingStatus: boolean;
}

function PaymentListItem({
  item: payment,
  onMarkPaid,
  onEditAmount,
  isUpdatingStatus,
}: PaymentListItemProps) {
  const influencerName =
    (payment.influencer?.name as never as string) || "Influencer";
  const avatarText = influencerName.slice(0, 2).toUpperCase();
  const campaignName = payment.campaign?.title || "Campaign";

  const dateSource =
    payment.status === "paid"
      ? payment.paymentDate || payment.updatedAt
      : payment.createdAt;
  const dateLabel = dateSource ? new Date(dateSource).toLocaleDateString() : "";

  return (
    <div className="flex items-center justify-between p-4">
      <Link
        href={
          payment.influencer?.id
            ? `/admin/users/${payment.influencer.id}`
            : "#"
        }
        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
      >
        <Avatar>
          <AvatarFallback>{avatarText}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium hover:underline">
            {influencerName as string}
          </p>
          <p className="text-sm text-muted-foreground">
            {campaignName as string}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold">
            GH₵{(payment.totalAmount || 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {payment.status === "paid"
              ? `Paid ${dateLabel}`
              : `Created ${dateLabel}`}
          </p>
        </div>
        <Badge
          className={statusColors[payment.status as keyof typeof statusColors]}
        >
          {payment.status}
        </Badge>
        {payment.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditAmount(payment)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit Amount
            </Button>
            <Button
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => onMarkPaid(payment)}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Mark Paid
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<"amount" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [campaignId, setCampaignId] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editError, setEditError] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentResponseDto | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const statusParam =
    activeTab === "all" ? undefined : (activeTab as "pending" | "paid");

  const {
    data: paymentsResponse,
    isLoading,
    isError,
    refetch,
  } = usePaymentsControllerFindAll({
    limit,
    page,
    status: statusParam,
    campaignId: campaignId || undefined,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
  });

  const { data: campaignsResponse } = useCampaignsControllerFindAll({
    limit: 100,
  });
  const campaigns = campaignsResponse?.data || [];

  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats,
  } = usePaymentsControllerGetAdminStats({
    query: {
      staleTime: 10_000,
    },
  });

  const { mutateAsync: updatePaymentStatus, isPending: isUpdatingStatus } =
    usePaymentsControllerUpdateStatus();

  const { mutateAsync: updatePayment, isPending: isUpdatingPayment } =
    usePaymentsControllerUpdate();

  const handleMarkPaid = (payment: Payment) => {
    setSelectedPayment(payment);
    setConfirmOpen(true);
  };

  const handleEditAmount = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditAmount((payment.totalAmount ?? 0).toString());
    setEditError("");
    setEditOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await paymentsControllerExportPaymentsToCsv({
        campaignId: campaignId || undefined,
        status: statusParam,
        search: debouncedSearch || undefined,
      });

      const url = window.URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isError || isErrorStats) {
    return (
      <ErrorState
        title="Failed to load payments"
        message="There was an error loading the payments queue."
        onRetry={() => {
          refetch();
          refetchStats();
        }}
      />
    );
  }

  const typedPayments = paymentsResponse?.data || [];
  const paymentsMeta = paymentsResponse?.meta;

  const totalPaid = stats?.totalPaid ?? 0;
  const pendingPayouts = stats?.pendingPayouts ?? 0;
  const pendingCount = stats?.pendingCount ?? 0;
  const paidThisMonth = stats?.paidThisMonth ?? 0;
  const now = new Date();

  const selectedInfluencerName =
    selectedPayment?.influencer?.name || "Influencer";
  const selectedCampaignName =
    selectedPayment?.campaign?.brandName || "Campaign";
  const selectedAmount = (selectedPayment?.totalAmount || 0).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage influencer payments and payouts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{pendingPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{paidThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {now.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by influencer or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setPage(1);
            }}
            className="text-sm border rounded px-3 py-2 bg-background"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {(campaign.title as unknown as string) || campaign.brandName}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "amount" | "date");
              setPage(1);
            }}
            className="text-sm border rounded px-3 py-2 bg-background"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              setPage(1);
            }}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-2">
              {pendingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Queue</CardTitle>
              <CardDescription>{typedPayments.length} payments</CardDescription>
            </CardHeader>
            <CardContent>
              <ListPaginationWrapper
                data={typedPayments}
                ListItem={(props) => (
                  <PaymentListItem
                    {...props}
                    onMarkPaid={handleMarkPaid}
                    onEditAmount={handleEditAmount}
                    isUpdatingStatus={isUpdatingStatus}
                  />
                )}
                isLoading={isLoading}
                emptyMessage="No payments found"
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
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setSelectedPayment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark payment as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the payment status to paid for{" "}
              {selectedInfluencerName as string} on {selectedCampaignName} (GH₵
              {selectedAmount}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!selectedPayment || isUpdatingStatus}
              onClick={async () => {
                if (!selectedPayment) return;
                const payload: UpdatePaymentStatusDto = { status: "paid" };
                await updatePaymentStatus({
                  id: selectedPayment.id,
                  data: payload,
                });
                await refetch();
                await refetchStats();
                setConfirmOpen(false);
                setSelectedPayment(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setSelectedPayment(null);
            setEditError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit payment amount</DialogTitle>
            <DialogDescription>
              Update the amount to be paid to{" "}
              {selectedInfluencerName as string} on {selectedCampaignName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount (GH₵)</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isUpdatingPayment}
              onClick={() => {
                setEditOpen(false);
                setSelectedPayment(null);
                setEditError("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedPayment || isUpdatingPayment}
              onClick={async () => {
                if (!selectedPayment) return;
                const amount = parseFloat(editAmount);
                if (isNaN(amount) || amount < 0) {
                  setEditError("Enter a valid amount");
                  return;
                }
                try {
                  await updatePayment({
                    id: selectedPayment.id,
                    data: { totalAmount: amount },
                  });
                  await refetch();
                  await refetchStats();
                  setEditOpen(false);
                  setSelectedPayment(null);
                  setEditError("");
                } catch (error: any) {
                  setEditError(
                    error?.response?.data?.message ||
                      "Failed to update payment amount",
                  );
                }
              }}
            >
              {isUpdatingPayment ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
