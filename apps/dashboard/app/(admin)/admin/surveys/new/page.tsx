"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSurveysControllerCreate,
  useUsersControllerGetClients,
  getSurveysControllerFindAllQueryKey,
  CreateSurveyDto,
} from "@workspace/client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SurveyForm } from "@/components/survey-form";
import { ClientCombobox } from "@/components/client-combobox";
import { type SurveyFormData } from "@/lib/survey-schemas";
import { LoadingState } from "@/components/ui/loading-state";

export default function CreateAdminSurveyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const { data: clientsResponse, isLoading: isLoadingClients } =
    useUsersControllerGetClients();

  const createMutation = useSurveysControllerCreate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getSurveysControllerFindAllQueryKey(),
        });
        router.push("/admin/surveys");
      },
    },
  });

  const onSubmit = (data: SurveyFormData) => {
    if (!clientId) {
      setClientError("Please select a client for this survey");
      return;
    }
    setClientError(null);

    const payload: CreateSurveyDto = {
      title: data.title,
      description: data.description,
      targetResponses: data.targetResponses,
      ageRange: data.ageRange,
      genderFilter: data.genderFilter,
      locationFilter: data.locationFilter,
      paymentPerResponse: data.paymentPerResponse,
      clientId,
      questions: data.questions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        questionOrder: q.questionOrder,
        isRequired: q.isRequired,
        options: q.options,
        imageUrls: q.imageUrls,
        ratingScaleType: q.ratingScaleType,
      })),
    };

    createMutation.mutate({ data: payload });
  };

  if (isLoadingClients) {
    return <LoadingState text="Loading..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/surveys">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create New Survey
          </h1>
          <p className="text-muted-foreground">
            Create a survey and assign it to a client
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Assignment</CardTitle>
          <CardDescription>
            Select which client this survey belongs to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="clientId">
              Assign to Client <span className="text-destructive">*</span>
            </Label>
            <ClientCombobox
              clients={clientsResponse || []}
              value={clientId}
              invalid={!!clientError}
              onChange={(id) => {
                setClientId(id);
                setClientError(null);
              }}
            />
            {clientError && (
              <p className="text-xs text-destructive">{clientError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <SurveyForm
        submitLabel="Create Survey"
        cancelHref="/admin/surveys"
        isSubmitting={createMutation.isPending}
        onSubmit={onSubmit}
        isError={createMutation.isError}
        errorText="Failed to create survey. Please check your details and try again."
      />
    </div>
  );
}
