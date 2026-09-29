"use client";

import { useParams } from "next/navigation";
import {
  GetSurveyResponseDto,
  useSurveysControllerFindOne,
  useSurveysControllerGetIndividualResponses,
  surveysControllerExportRespondentsToCsv,
} from "@workspace/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowLeft, Users, Download, Eye, Calendar, User } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListPaginationWrapper } from "@/components/ui/list-pagination-wrapper";
import Link from "next/link";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

export default function AdminSurveyResponsesPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const [selectedResponse, setSelectedResponse] =
    useState<GetSurveyResponseDto | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await surveysControllerExportRespondentsToCsv(surveyId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey-respondents-${survey?.title || surveyId}.csv`;
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

  const {
    data: survey,
    isLoading,
    isError,
    refetch,
  } = useSurveysControllerFindOne(surveyId);

  const { data: surveyResponses, isLoading: responsesLoading } =
    useSurveysControllerGetIndividualResponses(surveyId, {
      page,
      pageSize: limit,
    });

  if (isLoading) {
    return <LoadingState text="Loading responses..." />;
  }

  const responses = surveyResponses?.responses || [];

  if (isError || !survey) {
    return (
      <ErrorState
        title="Failed to load responses"
        message="There was an error loading the survey responses."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/surveys/${surveyId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Survey Responses
            </h1>
            <p className="text-muted-foreground">{survey.title}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Responses"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {survey.responsesCollected}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{survey.targetResponses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {survey.isAnonymous ? "Anonymous" : "Identified"}
            </div>
          </CardContent>
        </Card>
      </div>

      {responsesLoading ? (
        <LoadingState text="Loading responses..." />
      ) : survey.responsesCollected === 0 ||
        !responses ||
        responses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
            <p className="text-muted-foreground">
              This survey hasn't received any responses yet. Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Survey Responses ({surveyResponses?.total})</CardTitle>
            </CardHeader>
            <CardContent>
              <ListPaginationWrapper
                data={surveyResponses?.responses || []}
                ListItem={(response) => (
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        {!survey.isAnonymous &&
                          response.item.respondentIdentifier && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {response.item.respondentIdentifier}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({response.item.respondentIdentifier})
                              </span>
                            </div>
                          )}
                        {survey.isAnonymous && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {response.item.respondentIdentifier}
                            </span>
                            <Badge variant="secondary">Anonymous</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            response.item.responseDate,
                          ).toLocaleDateString()}
                        </div>
                        {response.item.timeTakenMinutes && (
                          <span>
                            Time taken: {response.item.timeTakenMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedResponse(response.item)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                )}
                isLoading={responsesLoading}
                emptyMessage="No responses found"
                page={page}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                meta={{
                  total: surveyResponses?.total || 0,
                  page: surveyResponses?.page || 1,
                  limit,
                }}
              />
            </CardContent>
          </Card>

          <Sheet
            open={!!selectedResponse}
            onOpenChange={(open) => !open && setSelectedResponse(null)}
          >
            <SheetContent
              side="right"
              className="w-full sm:max-w-2xl overflow-y-auto p-2"
            >
              <SheetHeader>
                <SheetTitle>Response Details</SheetTitle>
              </SheetHeader>
              {selectedResponse && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 p-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Respondent
                      </p>
                      <p className="text-lg font-semibold">
                        {survey.isAnonymous
                          ? selectedResponse.respondentIdentifier
                          : selectedResponse.respondent?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Submitted On
                      </p>
                      <p className="text-lg font-semibold">
                        {new Date(
                          selectedResponse.responseDate,
                        ).toLocaleString()}
                      </p>
                    </div>
                    {selectedResponse.timeTakenMinutes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Time Taken
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedResponse.timeTakenMinutes} minutes
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Answers</h3>
                    <div className="space-y-6">
                      {survey?.questions?.map(
                        (question: any, index: number) => {
                          const answer =
                            selectedResponse.answers?.[question.id] ||
                            selectedResponse.answers?.[index];
                          return (
                            <div
                              key={question.id}
                              className="p-4 bg-accent/30 rounded-lg"
                            >
                              <p className="font-medium mb-2">
                                Q{index + 1}: {question.questionText}
                              </p>
                              <div className="pl-4">
                                {Array.isArray(answer) ? (
                                  <ul className="list-disc list-inside space-y-1">
                                    {answer.map((item: any, i: number) => (
                                      <li
                                        key={i}
                                        className="text-muted-foreground"
                                      >
                                        {typeof item === "object"
                                          ? JSON.stringify(item)
                                          : item}
                                      </li>
                                    ))}
                                  </ul>
                                ) : typeof answer === "object" ? (
                                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {JSON.stringify(answer, null, 2)}
                                  </pre>
                                ) : (
                                  <p className="text-muted-foreground">
                                    {(answer as any) || "No answer provided"}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {selectedResponse.demographics && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Demographics
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        {Object.keys(selectedResponse.demographics.age).length >
                          0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Age
                            </p>
                            <div className="space-y-1">
                              {Object.entries(
                                selectedResponse.demographics.age,
                              ).map(([range, count]) => (
                                <p key={range} className="text-sm">
                                  {range}: {count}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {Object.keys(selectedResponse.demographics.gender)
                          .length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Gender
                            </p>
                            <div className="space-y-1">
                              {Object.entries(
                                selectedResponse.demographics.gender,
                              ).map(([gender, count]) => (
                                <p key={gender} className="text-sm">
                                  {gender}: {count}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {Object.keys(selectedResponse.demographics.location)
                          .length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Location
                            </p>
                            <div className="space-y-1">
                              {Object.entries(
                                selectedResponse.demographics.location,
                              ).map(([location, count]) => (
                                <p key={location} className="text-sm">
                                  {location}: {count}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
