"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSurveysControllerStartSurvey,
  useSurveysControllerSubmitResponse,
  getSurveysControllerGetInfluencerSurveysQueryKey,
  getSurveysControllerGetInfluencerStatsQueryKey,
} from "@workspace/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  questionOrder: number;
  isRequired: boolean;
  options?: string[];
  ratingScaleType?: string;
};

type Survey = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  paymentPerResponse?: number;
};

export default function TakeSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const surveyId = params.id as string;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);

  // Check assignment status from the survey data (like campaigns)
  const hasAlreadySubmitted = assignmentStatus === "completed";

  const startMutation = useSurveysControllerStartSurvey({
    mutation: {
      onSuccess: (data: any) => {
        setSurvey(data);
        // Capture assignment status from the response (like campaigns)
        if (data.assignment?.status) {
          setAssignmentStatus(data.assignment.status);
        }
      },
      onError: (error: any) => {
        console.error("Failed to start survey:", error);
      },
    },
  });

  const submitMutation = useSurveysControllerSubmitResponse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getSurveysControllerGetInfluencerSurveysQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getSurveysControllerGetInfluencerStatsQueryKey(),
        });
        router.push("/influencer/surveys");
      },
    },
  });

  // Start survey on mount (only if not already submitted)
  useState(() => {
    if (
      surveyId &&
      !survey &&
      !startMutation.isPending &&
      !hasAlreadySubmitted
    ) {
      startMutation.mutate({ id: surveyId });
    }
  });

  const currentQuestion = survey?.questions?.[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === (survey?.questions?.length || 0) - 1;
  const canProceed =
    !currentQuestion?.isRequired || answers[currentQuestion?.id];

  const handleAnswerChange = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleNext = () => {
    console.log(answers);
    if (isLastQuestion) {
      // Submit survey
      submitMutation.mutate({
        id: surveyId,
        data: { answers },
      });
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  if (startMutation.isError) {
    const err = startMutation.error as unknown as {
      response?: { data?: { message?: string } };
    };
    return (
      <ErrorState
        title="Survey unavailable"
        message={
          err?.response?.data?.message ||
          "This survey is not accepting responses right now."
        }
      />
    );
  }

  // Show message if already submitted
  if (hasAlreadySubmitted) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/influencer/surveys">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Survey Already Completed</CardTitle>
            <CardDescription>
              You have already submitted a response to this survey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Your response has been recorded.</span>
            </div>
            <Button className="mt-6" asChild>
              <Link href="/influencer/surveys">Back to Surveys</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return <LoadingState text="Loading questions..." />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/influencer/surveys">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surveys
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{survey.title}</CardTitle>
              <CardDescription>{survey.description}</CardDescription>
            </div>
            {survey.paymentPerResponse && (
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  GH₵{survey.paymentPerResponse}
                </p>
                <p className="text-xs text-muted-foreground">Reward</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {survey.questions.length}
              </span>
              <span className="font-medium">
                {Math.round(
                  ((currentQuestionIndex + 1) / survey.questions.length) * 100,
                )}
                %
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">
                {currentQuestion.questionText}
                {currentQuestion.isRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
            </div>

            {/* Answer input based on question type */}
            {currentQuestion.questionType === "multiple_choice_single" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) =>
                  handleAnswerChange(currentQuestion.id, value)
                }
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.questionType === "multiple_choice_multiple" && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`checkbox-${index}`}
                      checked={
                        answers[currentQuestion.id]?.includes(option) || false
                      }
                      onCheckedChange={(checked) => {
                        const currentAnswers =
                          answers[currentQuestion.id] || [];
                        const newAnswers = checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter((a: string) => a !== option);
                        handleAnswerChange(currentQuestion.id, newAnswers);
                      }}
                    />
                    <Label
                      htmlFor={`checkbox-${index}`}
                      className="cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "yes_no" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) =>
                  handleAnswerChange(currentQuestion.id, value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="yes-option" />
                  <Label htmlFor="yes-option" className="cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="no-option" />
                  <Label htmlFor="no-option" className="cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.questionType === "short_text" && (
              <Input
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                placeholder="Type your answer here..."
              />
            )}

            {currentQuestion.questionType === "long_text" && (
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                placeholder="Type your answer here..."
                rows={5}
              />
            )}

            {currentQuestion.questionType === "rating_stars" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      handleAnswerChange(currentQuestion.id, rating)
                    }
                    className="transition-colors"
                  >
                    <Star
                      className={cn(
                        "h-10 w-10",
                        answers[currentQuestion.id] >= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300",
                      )}
                    />
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "rating_scale" && (
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={
                      answers[currentQuestion.id] === rating
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleAnswerChange(currentQuestion.id, rating)
                    }
                    className="w-12 h-12"
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "likert" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) =>
                  handleAnswerChange(currentQuestion.id, value)
                }
                className="space-y-2"
              >
                {[
                  "Strongly Disagree",
                  "Disagree",
                  "Neutral",
                  "Agree",
                  "Strongly Agree",
                ].map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`likert-${index}`} />
                    <Label
                      htmlFor={`likert-${index}`}
                      className="cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.questionType === "image_selection" && (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                Image selection questions are not yet supported in this
                interface.
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : isLastQuestion ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Survey
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {submitMutation.isError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
              <p className="text-sm text-destructive">
                Failed to submit survey. Please try again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
