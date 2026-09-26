"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  useSurveysControllerGetSurveyAnalytics,
  useSurveysControllerGetIndividualResponses,
  useSurveysControllerGetCrossTabulation,
} from "@workspace/client";
import { OverviewCards } from "./components/OverviewCards";
import { SummaryTab } from "./components/SummaryTab";
import { IndividualResponsesTab } from "./components/IndividualResponsesTab";
import { CrossTabTab } from "./components/CrossTabTab";
import { ChartsGalleryTab } from "./components/ChartsGalleryTab";
import { jsPDF } from "jspdf";
import { useToast } from "@workspace/ui/hooks/use-toast";
import * as XLSX from "xlsx";
import { showCountryNameByAlpha3 } from "@/lib/show-country-name";

export default function SurveyAnalyticsPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const [activeTab, setActiveTab] = useState("summary");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [selectedSegment, setSelectedSegment] = useState<
    "age" | "gender" | "location"
  >("age");
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();

  const {
    data: survey,
    isLoading,
    isError,
    refetch,
  } = useSurveysControllerGetSurveyAnalytics(surveyId);

  // Fetch individual responses with pagination
  const { data: responsesData } = useSurveysControllerGetIndividualResponses(
    surveyId,
    { page: currentPage, pageSize },
    { query: { enabled: activeTab === "responses" } },
  );

  console.log("Responses Data:", responsesData);

  // Fetch cross-tabulation data when needed
  const { data: crossTabData } = useSurveysControllerGetCrossTabulation(
    surveyId,
    { questionId: selectedQuestion, segmentBy: selectedSegment },
    { query: { enabled: activeTab === "crosstab" && !!selectedQuestion } },
  );

  if (isLoading) return <LoadingState text="Loading survey analytics..." />;
  if (isError || !survey)
    return (
      <ErrorState
        title="Failed to load analytics"
        message="Error loading analytics."
        onRetry={() => refetch()}
      />
    );

  const hasResponses = survey.responsesCollected > 0;

  const questionAnalytics = survey.answers.map((answer) => {
    const optionPercentages: Record<string, number> = {};
    const optionCounts: Record<string, number> = {};
    Object.entries(answer.distribution || {}).forEach(([key, data]) => {
      optionCounts[key] = (data as { count: number }).count;
      optionPercentages[key] = (data as { percentage: number }).percentage;
    });
    return {
      question: {
        id: answer.questionId,
        question_text: answer.questionText,
        question_type: answer.questionType,
        is_required: true,
      },
      totalResponses: answer.totalResponses,
      analytics: { optionCounts, optionPercentages },
    };
  });

  // Get actual responses from API
  const paginatedResponses = responsesData?.responses || [];
  const totalPages = responsesData
    ? Math.ceil(responsesData.total / responsesData.pageSize)
    : 0;

  const exportToExcel = async () => {
    if (!survey) return;

    try {
      setExportLoading(true);

      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Survey Analytics Report"],
        ["Generated on", new Date().toLocaleString()],
        [""],
        ["Survey Information"],
        ["Title", survey.title],
        ["Description", survey.description || "N/A"],
        ["Status", survey.status],
        ["Target Responses", survey.targetResponses],
        ["Collected Responses", survey.responsesCollected],
        [
          "Completion Rate",
          `${((survey.responsesCollected / survey.targetResponses) * 100).toFixed(1)}%`,
        ],
        ["Average Time (minutes)", survey.averageTimeMinutes],
        [""],
        ["Demographics Breakdown"],
        ["Age Ranges"],
        ...Object.entries(survey.demographics.age).map(([age, count]) => [
          age,
          count,
        ]),
        [""],
        ["Genders"],
        ...Object.entries(survey.demographics.gender).map(([gender, count]) => [
          gender,
          count,
        ]),
        [""],
        ["Locations"],
        ...Object.entries(survey.demographics.location).map(
          ([location, count]) => [
            showCountryNameByAlpha3(location) || location,
            count,
          ],
        ),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Responses sheet - fetch all responses for export
      if (responsesData?.responses) {
        const exportData = responsesData.responses.map((response: any) => {
          const row: any = {
            "Response ID": response.respondentIdentifier || response.id,
            Date: new Date(response.responseDate).toLocaleString(),
            "Time (minutes)": response.timeTakenMinutes || 0,
          };

          // Add answers for each question
          survey.answers.forEach((answer: any, index: number) => {
            const answerValue = response.answers?.[answer.questionId];
            row[`Q${index + 1}`] = Array.isArray(answerValue)
              ? answerValue.join(", ")
              : String(answerValue || "");
          });

          return row;
        });

        const responsesSheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(
          workbook,
          responsesSheet,
          "Individual Responses",
        );
      }

      // Question analytics sheet
      const analyticsData = questionAnalytics.map((qa, index) => {
        const row: any = {
          "Question Number": `Q${index + 1}`,
          Question: qa.question.question_text,
          Type: qa.question.question_type,
          "Total Responses": qa.totalResponses,
          Required: qa.question.is_required ? "Yes" : "No",
        };

        if (qa.analytics.optionPercentages) {
          Object.entries(qa.analytics.optionPercentages).forEach(
            ([option, percentage]) => {
              row[`${option} %`] = percentage.toFixed(1);
            },
          );
        }

        return row;
      });

      const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
      XLSX.utils.book_append_sheet(
        workbook,
        analyticsSheet,
        "Question Analytics",
      );

      XLSX.writeFile(workbook, `Survey_${survey.title}_Analytics.xlsx`);

      toast({
        title: "Excel Export Complete",
        description: "Survey analytics have been exported to Excel.",
      });
    } catch (error) {
      console.error("Excel export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export to Excel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!survey) return;

    try {
      setExportLoading(true);

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Cover page
      pdf.setFontSize(20);
      pdf.text("Survey Analytics Report", pageWidth / 2, 40, {
        align: "center",
      });

      pdf.setFontSize(16);
      pdf.text(survey.title, pageWidth / 2, 60, { align: "center" });

      pdf.setFontSize(12);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        80,
        { align: "center" },
      );

      // Executive Summary
      pdf.text("Executive Summary", 20, 110);
      pdf.setFontSize(10);
      pdf.text(`Total Responses: ${survey.responsesCollected}`, 20, 125);
      pdf.text(`Target Responses: ${survey.targetResponses}`, 20, 135);
      pdf.text(
        `Completion Rate: ${((survey.responsesCollected / survey.targetResponses) * 100).toFixed(1)}%`,
        20,
        145,
      );
      pdf.text(`Average Time: ${survey.averageTimeMinutes} minutes`, 20, 155);

      // Add question summaries
      let yPosition = 175;
      questionAnalytics.forEach((qa, index) => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 30;
        }

        pdf.setFontSize(12);
        pdf.text(`Q${index + 1}: ${qa.question.question_text}`, 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.text(`Responses: ${qa.totalResponses}`, 20, yPosition);
        yPosition += 10;

        if (qa.analytics.optionPercentages) {
          Object.entries(qa.analytics.optionPercentages).forEach(
            ([option, percentage]) => {
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = 30;
              }
              pdf.text(`${option}: ${percentage.toFixed(1)}%`, 25, yPosition);
              yPosition += 8;
            },
          );
        }

        yPosition += 10;
      });

      pdf.save(`Survey_${survey.title}_Report.pdf`);

      toast({
        title: "PDF Report Generated",
        description: "Survey report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/client/surveys">
            <ChevronLeft className="h-4 w-4" />
            Back to Surveys
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{survey.title}</h1>
          <p className="text-muted-foreground mt-1">{survey.description}</p>
        </div>
      </div>

      <OverviewCards
        survey={survey}
        exportLoading={exportLoading}
        onGeneratePDF={generatePDFReport}
        onExportExcel={exportToExcel}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="responses">Individual Responses</TabsTrigger>
          <TabsTrigger value="crosstab">Cross-Tabulation</TabsTrigger>
          <TabsTrigger value="charts">Charts & Graphs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-6">
          <SummaryTab
            questionAnalytics={questionAnalytics}
            hasResponses={hasResponses}
          />
        </TabsContent>

        <TabsContent value="responses" className="space-y-6 mt-6">
          <IndividualResponsesTab
            survey={survey}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            paginatedResponses={paginatedResponses}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onExport={exportToExcel}
            exportLoading={exportLoading}
          />
        </TabsContent>

        <TabsContent value="crosstab" className="space-y-6 mt-6">
          <CrossTabTab
            survey={survey}
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={setSelectedQuestion}
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
            hasResponses={hasResponses}
            crossTabData={crossTabData}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 mt-6">
          <ChartsGalleryTab
            hasResponses={hasResponses}
            questionAnalytics={questionAnalytics}
            survey={survey}
          />
        </TabsContent>
      </Tabs>

      {exportLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
              <span>Generating export...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
