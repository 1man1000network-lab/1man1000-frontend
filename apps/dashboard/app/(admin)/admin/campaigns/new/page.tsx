"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCampaignsControllerCreate,
  useCampaignsControllerFindOne,
  useUsersControllerGetClients,
  getCampaignsControllerFindAllQueryKey,
  CreateCampaignDto,
} from "@workspace/client";
import axios from "axios";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CampaignForm } from "@/components/campaign-form";
import { type CampaignFormData } from "@/lib/schemas";
import { LoadingState } from "@/components/ui/loading-state";

function CreateCampaignContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parent");

  const { data: clientsResponse, isLoading: isLoadingClients } =
    useUsersControllerGetClients();

  const { data: parentCampaign, isLoading: isLoadingParent } =
    useCampaignsControllerFindOne(parentId || "", {
      query: { enabled: !!parentId },
    });

  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  const createMutation = useCampaignsControllerCreate({
    mutation: {
      onSuccess: async (response, variables) => {
        // If there's a file, upload it after campaign creation
        const file = (variables as { file?: File }).file;
        if (file && response.id) {
          setIsUploadingAsset(true);
          try {
            const formData = new FormData();
            formData.append("asset", file);

            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            await axios.post(
              `${apiUrl}/api/campaigns/${response.id}/upload-asset`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              },
            );
          } catch (error) {
            console.error("Error uploading asset:", error);
          } finally {
            setIsUploadingAsset(false);
          }
        }

        queryClient.invalidateQueries({
          queryKey: getCampaignsControllerFindAllQueryKey(),
        });
        router.push("/admin/campaigns");
      },
    },
  });

  const onSubmit = (data: CampaignFormData, file?: File) => {
    const payload = {
      ...data,
      parentCampaignId: parentId || undefined,
    } as CreateCampaignDto;
    createMutation.mutate({ data: payload, file } as Parameters<
      typeof createMutation.mutate
    >[0]);
  };

  const parent =
    parentCampaign && "brandName" in parentCampaign
      ? {
          id: parentCampaign.id,
          title: parentCampaign.title,
          brandName: parentCampaign.brandName,
        }
      : null;

  if (isLoadingClients || (parentId && isLoadingParent)) {
    return <LoadingState text="Loading..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {parent ? "Create Sub-Campaign" : "Create Campaign"}
          </h1>
          <p className="text-muted-foreground">
            {parent
              ? `Create a sub-campaign under "${parent.title || parent.brandName}"`
              : "Create a new campaign for clients"}
          </p>
        </div>
      </div>

      <CampaignForm
        submitLabel={parent ? "Create Sub-Campaign" : "Create Campaign"}
        cancelHref="/admin/campaigns"
        isSubmitting={createMutation.isPending || isUploadingAsset}
        onSubmit={onSubmit}
        isError={createMutation.isError}
        errorText="Failed to create campaign. Please try again."
        clients={clientsResponse || []}
        parentCampaign={parent}
      />
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense>
      <CreateCampaignContent />
    </Suspense>
  );
}
