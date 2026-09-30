"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useCampaignsControllerFindAll,
  useCampaignsControllerUpdateStatus,
  UpdateCampaignStatusDtoStatus,
  CampaignsListResponseDto,
} from "@workspace/client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Loader2,
  ArrowUpDown,
  Pause,
  Play,
  OctagonX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTable } from "@workspace/ui/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [campaigns, setCampaigns] = useState<CampaignsListResponseDto["data"]>(
    [],
  );

  const [approvingCampaign, setApprovingCampaign] = useState<
    CampaignsListResponseDto["data"][number] | null
  >(null);
  const [paymentTiers, setPaymentTiers] = useState<
    { lowerLimit: string; upperLimit: string; amount: string }[]
  >([{ lowerLimit: "0", upperLimit: "", amount: "" }]);

  const queryParams: Record<string, string | number> = {};
  if (statusFilter && statusFilter !== "all") {
    queryParams.status = statusFilter;
  }

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCampaignsControllerFindAll({
    page,
    limit,
    ...queryParams,
  });

  useEffect(() => {
    if (response && !isLoading) {
      setCampaigns(response.data || []);
    }
  }, [response, isLoading]);

  const updateStatusMutation = useCampaignsControllerUpdateStatus({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });

  const handleApproveClick = useCallback(
    (campaign: CampaignsListResponseDto["data"][number]) => {
      setApprovingCampaign(campaign);
      // Pre-fill if campaign already has payment tiers
      if (campaign.paymentTiers && campaign.paymentTiers.length > 0) {
        setPaymentTiers(
          campaign.paymentTiers.map((tier) => ({
            lowerLimit: String(tier.lowerLimit),
            upperLimit: tier.upperLimit ? String(tier.upperLimit) : "",
            amount: String(tier.amount),
          })),
        );
      } else {
        setPaymentTiers([{ lowerLimit: "0", upperLimit: "", amount: "" }]);
      }
    },
    [],
  );

  const confirmApprove = useCallback(async () => {
    if (!approvingCampaign) return;

    try {
      // Validate and transform payment tiers
      const validTiers = paymentTiers
        .filter((tier) => tier.amount && parseFloat(tier.amount) > 0)
        .map((tier) => ({
          lowerLimit: parseInt(tier.lowerLimit) || 0,
          upperLimit: tier.upperLimit ? parseInt(tier.upperLimit) : undefined,
          amount: parseFloat(tier.amount) || 0,
        }));

      if (validTiers.length === 0) {
        alert("Please configure at least one payment tier with a valid amount");
        return;
      }

      await updateStatusMutation.mutateAsync({
        id: approvingCampaign.id,
        data: {
          status: UpdateCampaignStatusDtoStatus.approved,
          paymentTiers: validTiers,
        },
      });
      setApprovingCampaign(null);
      setPaymentTiers([{ lowerLimit: "0", upperLimit: "", amount: "" }]);
    } catch (error) {
      console.error("Error approving campaign:", error);
    }
  }, [approvingCampaign, paymentTiers, updateStatusMutation]);

  const handleReject = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to reject this campaign?")) {
        try {
          await updateStatusMutation.mutateAsync({
            id,
            data: { status: UpdateCampaignStatusDtoStatus.rejected },
          });
        } catch (error) {
          console.error("Error rejecting campaign:", error);
        }
      }
    },
    [updateStatusMutation],
  );

  const handlePause = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "Pause this campaign? Influencers won't be able to participate or submit while paused.",
        )
      ) {
        try {
          await updateStatusMutation.mutateAsync({
            id,
            data: { status: UpdateCampaignStatusDtoStatus.paused },
          });
        } catch (error) {
          console.error("Error pausing campaign:", error);
        }
      }
    },
    [updateStatusMutation],
  );

  const handleResume = useCallback(
    async (id: string) => {
      try {
        await updateStatusMutation.mutateAsync({
          id,
          data: { status: UpdateCampaignStatusDtoStatus.approved },
        });
      } catch (error) {
        console.error("Error resuming campaign:", error);
      }
    },
    [updateStatusMutation],
  );

  const handleEnd = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "End this campaign? It will be marked as completed and will no longer accept participation or submissions.",
        )
      ) {
        try {
          await updateStatusMutation.mutateAsync({
            id,
            data: { status: UpdateCampaignStatusDtoStatus.completed },
          });
        } catch (error) {
          console.error("Error ending campaign:", error);
        }
      }
    },
    [updateStatusMutation],
  );

  const columns: ColumnDef<CampaignsListResponseDto["data"][number]>[] =
    useMemo(
      () => [
        {
          accessorKey: "title",
          size: 200,
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                Campaign
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const campaign = row.original;
            return (
              <div className="flex flex-col">
                <span className="font-medium">
                  {(campaign.title || "—") as string}
                </span>
                <span className="text-sm text-muted-foreground">
                  {campaign.brandName}
                </span>
              </div>
            );
          },
        },
        {
          accessorKey: "client",
          size: 150,
          header: "Client",
          cell: ({ row }) => {
            const client = row.original.client;
            return client?.name || "Unknown";
          },
        },
        {
          accessorKey: "status",
          size: 100,
          header: "Status",
          cell: ({ row }) => {
            const status = row.original.status;
            return <StatusBadge status={status} />;
          },
        },
        {
          id: "influencers",
          size: 100,
          header: "Influencers",
          cell: ({ row }) => {
            const anyRow = row.original as unknown as {
              assignments?: unknown[];
              _count?: { assignments?: number };
            };
            const count =
              typeof anyRow._count?.assignments === "number"
                ? anyRow._count.assignments
                : anyRow.assignments?.length || 0;
            return (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{count}</span>
              </div>
            );
          },
        },
        {
          id: "targetViews",
          size: 150,
          header: "Target Views",
          cell: ({ row }) => {
            const range = row.original.targetViewRange;
            if (!range) return "N/A";
            return (
              <span className="text-sm">
                {range.min?.toLocaleString()} - {range.max?.toLocaleString()}
              </span>
            );
          },
        },
        {
          accessorKey: "budget",
          size: 100,
          header: "Budget",
          cell: ({ row }) => {
            const budget = row.original.budget;
            return budget ? `GH₵${budget.toLocaleString()}` : "N/A";
          },
        },
        {
          id: "dates",
          size: 150,
          header: "Campaign Period",
          cell: ({ row }) => {
            const campaign = row.original;
            return (
              <div className="text-sm">
                <div>{new Date(campaign.startDate).toLocaleDateString()}</div>
                <div className="text-muted-foreground">
                  {new Date(campaign.endDate).toLocaleDateString()}
                </div>
              </div>
            );
          },
        },
        {
          id: "actions",
          size: 60,
          header: "Actions",
          cell: ({ row }) => {
            const campaign = row.original;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/campaigns/${campaign.id}`);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/admin/campaigns/${campaign.id}/influencers`,
                      );
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Influencers
                  </DropdownMenuItem>
                  {campaign.status === "pending" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveClick(campaign);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(campaign.id);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {campaign.status === "approved" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePause(campaign.id);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnd(campaign.id);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <OctagonX className="mr-2 h-4 w-4" />
                        End Campaign
                      </DropdownMenuItem>
                    </>
                  )}
                  {campaign.status === "paused" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResume(campaign.id);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnd(campaign.id);
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <OctagonX className="mr-2 h-4 w-4" />
                        End Campaign
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ],
      [
        router,
        updateStatusMutation.isPending,
        handleApproveClick,
        handleReject,
        handlePause,
        handleResume,
        handleEnd,
      ],
    );

  const CampaignFilter = useCallback(() => {
    return (
      <div className="flex items-center space-x-2 flex-1">
        <div className="relative flex-1 max-w-sm">
          <input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <select
          value={statusFilter || "all"}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value === "all" ? "" : value);
            setPage(1);
          }}
          className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[180px]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    );
  }, [searchQuery, statusFilter]);

  const TableLoadingComponent = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-3 text-muted-foreground">Loading campaigns...</span>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">
              Manage and monitor all platform campaigns
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </div>
        <div className="rounded-md border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Failed to load campaigns
          </h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading campaigns. Please try again.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor all platform campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={campaigns}
        showColumnVisibility={true}
        onRowClick={(campaign) =>
          router.push(`/admin/campaigns/${campaign.id}`)
        }
        FilterComponent={CampaignFilter}
        LoadingComponent={TableLoadingComponent}
        isLoading={isLoading && campaigns.length === 0}
        pagination={{
          page,
          limit,
          total: (response?.meta?.total as number) ?? 0,
          totalPages: (response?.meta?.totalPages as number) ?? 0,
          onPageChange: (newPage) => setPage(newPage),
          onPageSizeChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
      />

      {/* Approval Modal with Payment Tier Settings */}
      <Dialog
        open={!!approvingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setApprovingCampaign(null);
            setPaymentTiers([{ lowerLimit: "0", upperLimit: "", amount: "" }]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Approve Campaign</DialogTitle>
            <DialogDescription>
              Configure payment tiers for &quot;
              {(approvingCampaign?.title as any) ||
                approvingCampaign?.brandName}
              &quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Tiers</CardTitle>
                <CardDescription>
                  Define payment ranges for influencers. Leave upper limit empty
                  for infinity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="grid gap-4 sm:grid-cols-3 items-end"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`lowerLimit-${index}`}>
                        Lower Limit (views)
                      </Label>
                      <Input
                        id={`lowerLimit-${index}`}
                        type="number"
                        placeholder="0"
                        value={tier.lowerLimit}
                        onChange={(e) => {
                          const newTiers = [...paymentTiers] as any;
                          newTiers[index].lowerLimit = e.target.value;
                          setPaymentTiers(newTiers);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`upperLimit-${index}`}>
                        Upper Limit (views)
                      </Label>
                      <Input
                        id={`upperLimit-${index}`}
                        type="number"
                        placeholder="∞ (empty = infinity)"
                        value={tier.upperLimit}
                        onChange={(e) => {
                          const newTiers = [...paymentTiers] as any;
                          newTiers[index].upperLimit = e.target.value;
                          setPaymentTiers(newTiers);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`amount-${index}`}>Amount (GH₵)</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0.50"
                          value={tier.amount}
                          onChange={(e) => {
                            const newTiers = [...paymentTiers] as any;
                            newTiers[index].amount = e.target.value;
                            setPaymentTiers(newTiers);
                          }}
                        />
                        {paymentTiers.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newTiers = paymentTiers.filter(
                                (_, i) => i !== index,
                              );
                              setPaymentTiers(newTiers);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    setPaymentTiers([
                      ...paymentTiers,
                      { lowerLimit: "", upperLimit: "", amount: "" },
                    ])
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Tier
                </Button>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovingCampaign(null);
                setPaymentTiers([
                  { lowerLimit: "0", upperLimit: "", amount: "" },
                ]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={
                updateStatusMutation.isPending ||
                !paymentTiers.some(
                  (tier) => tier.amount && parseFloat(tier.amount) > 0,
                )
              }
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
