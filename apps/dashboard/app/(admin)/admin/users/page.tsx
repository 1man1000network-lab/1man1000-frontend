"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUsersControllerFindAll,
  useUsersControllerUpdateStatus,
  useUsersControllerDelete,
  useUsersControllerGetAdminStats,
  useUsersControllerFlagUser,
  useUsersControllerUnflagUser,
  getUsersControllerFindAllQueryKey,
  UpdateUserStatusDtoStatus,
  usersControllerExportUsersToCsv,
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
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Eye,
  Ban,
  Trash2,
  Loader2,
  Download,
  Flag,
  FlagOff,
} from "lucide-react";
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
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListPaginationWrapper } from "@/components/ui/list-pagination-wrapper";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt: string;
  isFlagged?: boolean;
  flagReason?: string | null;
  flaggedAt?: string | null;
};

function UserListItem({
  item: user,
  onDelete,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
  onFlag,
  onUnflag,
  isStatusPending,
  isDeletePending,
  isFlagPending,
}: {
  item: User;
  onDelete: (user: User) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string) => void;
  onUnsuspend: (id: string) => void;
  onFlag: (user: User) => void;
  onUnflag: (id: string) => void;
  isStatusPending: boolean;
  isDeletePending: boolean;
  isFlagPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <Link href={`/admin/users/${user.id}`}>
        <div className="flex items-center gap-4">
          <Avatar className="h-11 w-11">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold">
              {user.name?.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="capitalize border-border/60">
          {user.role}
        </Badge>
        <StatusBadge status={user.status} />
        {user.isFlagged && (
          <Badge
            variant="outline"
            className="border-amber-500/60 bg-amber-500/10 text-amber-600"
            title={user.flagReason ?? "Flagged"}
          >
            <Flag className="mr-1 h-3 w-3" />
            Flagged
          </Badge>
        )}
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {user.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-emerald-600"
                  onClick={() => onApprove(user.id)}
                  disabled={isStatusPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onReject(user.id)}
                  disabled={isStatusPending}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}

            {user.status !== "suspended" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onSuspend(user.id)}
                  disabled={isStatusPending}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-emerald-600"
                  onClick={() => onUnsuspend(user.id)}
                  disabled={isStatusPending}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Unsuspend
                </DropdownMenuItem>
              </>
            )}
            {user.role === "influencer" &&
              (user.isFlagged ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-emerald-600"
                    onClick={() => onUnflag(user.id)}
                    disabled={isFlagPending}
                  >
                    <FlagOff className="mr-2 h-4 w-4" />
                    Remove Flag
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600"
                    onClick={() => onFlag(user)}
                    disabled={isFlagPending}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Flag Account
                  </DropdownMenuItem>
                </>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(user)}
              disabled={isDeletePending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToFlag, setUserToFlag] = useState<User | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagError, setFlagError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useUsersControllerFindAll({
    limit,
    page,
    search: searchQuery || undefined,
    role: (activeTab === "all" ? undefined : activeTab) as
      | "influencer"
      | "client"
      | "admin"
      | undefined,
  });

  const { data: statsResponse, isLoading: isLoadingStats } =
    useUsersControllerGetAdminStats();

  const users = (response?.data || []) as User[];

  const stats = statsResponse || {
    totalUsers: 0,
    influencerCount: 0,
    clientCount: 0,
    adminCount: 0,
    pendingCount: 0,
    approvedCount: 0,
  };

  const updateStatusMutation = useUsersControllerUpdateStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getUsersControllerFindAllQueryKey(),
        });
      },
    },
  });

  const deleteMutation = useUsersControllerDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getUsersControllerFindAllQueryKey(),
        });
        setUserToDelete(null);
      },
    },
  });

  const flagMutation = useUsersControllerFlagUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getUsersControllerFindAllQueryKey(),
        });
        setUserToFlag(null);
        setFlagReason("");
        setFlagError(null);
      },
      onError: (error) => {
        setFlagError(
          (error as unknown as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || "Failed to flag user",
        );
      },
    },
  });

  const unflagMutation = useUsersControllerUnflagUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getUsersControllerFindAllQueryKey(),
        });
      },
    },
  });

  const [isExporting, setIsExporting] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "influencer" && user.role === "influencer") ||
      (activeTab === "client" && user.role === "client");
    return matchesTab;
  });

  const { totalUsers, influencerCount, clientCount, pendingCount } = stats;

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({
      id,
      data: { status: UpdateUserStatusDtoStatus.approved },
    });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({
      id,
      data: { status: UpdateUserStatusDtoStatus.rejected },
    });
  };

  const handleSuspend = (id: string) => {
    updateStatusMutation.mutate({
      id,
      data: { status: "suspended" as unknown as UpdateUserStatusDtoStatus },
    });
  };

  const handleUnsuspend = (id: string) => {
    updateStatusMutation.mutate({
      id,
      data: { status: UpdateUserStatusDtoStatus.approved },
    });
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate({ id: userToDelete.id });
    }
  };

  const handleFlag = (user: User) => {
    setFlagReason("");
    setFlagError(null);
    setUserToFlag(user);
  };

  const confirmFlag = () => {
    const reason = flagReason.trim();
    if (!reason) {
      setFlagError("A reason is required to flag this account");
      return;
    }
    if (userToFlag) {
      flagMutation.mutate({ id: userToFlag.id, data: { reason } });
    }
  };

  const handleUnflag = (id: string) => {
    unflagMutation.mutate({ id });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await usersControllerExportUsersToCsv({
        role: (activeTab === "all" ? undefined : activeTab) as
          | "influencer"
          | "client"
          | "admin"
          | undefined,
        search: searchQuery || undefined,
      });

      // Create blob and download
      const url = window.URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
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

  if (isError) {
    return (
      <ErrorState
        title="Failed to load users"
        message="There was an error loading the users. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Users</h1>
        <p className="text-muted-foreground">
          Manage platform users and their permissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : totalUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Influencers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : influencerCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : clientCount}
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
              {isLoadingStats ? "..." : pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to first page when searching
            }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setPage(1); // Reset to first page when changing tabs
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All Users ({totalUsers})</TabsTrigger>
          <TabsTrigger value="influencer">
            Influencers ({influencerCount})
          </TabsTrigger>
          <TabsTrigger value="client">Clients ({clientCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>
                {filteredUsers.length} users found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListPaginationWrapper
                data={filteredUsers}
                ListItem={(props) => (
                  <UserListItem
                    {...props}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSuspend={handleSuspend}
                    onUnsuspend={handleUnsuspend}
                    onFlag={handleFlag}
                    onUnflag={handleUnflag}
                    isStatusPending={updateStatusMutation.isPending}
                    isDeletePending={deleteMutation.isPending}
                    isFlagPending={
                      flagMutation.isPending || unflagMutation.isPending
                    }
                  />
                )}
                isLoading={isLoading}
                emptyMessage="No users found"
                meta={response?.meta}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {userToDelete?.name || userToDelete?.email}? This action cannot be
              undone. All associated data including campaigns, submissions, and
              payments will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flag Account Dialog */}
      <Dialog
        open={!!userToFlag}
        onOpenChange={(open) => {
          if (!open) {
            setUserToFlag(null);
            setFlagReason("");
            setFlagError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Account</DialogTitle>
            <DialogDescription>
              Flag {userToFlag?.name || userToFlag?.email} for review. The
              influencer will be notified with the reason you provide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="flag-reason">Reason for flagging *</Label>
            <Textarea
              id="flag-reason"
              placeholder="e.g., Submitted fake views, multiple fake accounts, spam submissions..."
              value={flagReason}
              onChange={(e) => {
                setFlagReason(e.target.value);
                setFlagError(null);
              }}
              rows={3}
            />
            {flagError && (
              <p className="text-sm text-destructive">{flagError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUserToFlag(null);
                setFlagReason("");
                setFlagError(null);
              }}
              disabled={flagMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmFlag}
              disabled={flagMutation.isPending}
            >
              {flagMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Flag className="mr-2 h-4 w-4" />
              )}
              Flag Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
