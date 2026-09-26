import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Filter, FileSpreadsheet } from "lucide-react";

interface IndividualResponsesTabProps {
  survey: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paginatedResponses: any[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  onExport: () => void;
  exportLoading: boolean;
  isLoading?: boolean;
}

export function IndividualResponsesTab(props: IndividualResponsesTabProps) {
  const {
    survey,
    searchTerm,
    setSearchTerm,
    paginatedResponses,
    currentPage,
    totalPages,
    setCurrentPage,
    pageSize,
    setPageSize,
    onExport,
    exportLoading,
    isLoading = false,
  } = props;

  const totalResponses = survey.responsesCollected || 0;
  const responsesPerPage = paginatedResponses.length;
  const startIndex = (currentPage - 1) * responsesPerPage + 1;
  const endIndex = Math.min(currentPage * responsesPerPage, totalResponses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual Responses</CardTitle>
        <CardDescription>
          Detailed view of all survey responses with pagination and filtering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={onExport} disabled={exportLoading}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        <div className="relative overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full border-collapse border-0">
            <thead>
              <tr className="bg-muted">
                <th className="sticky left-0 z-10 bg-muted border-r border-gray-200 p-2 text-left min-w-[120px]">
                  Response ID
                </th>
                <th className="border-r border-gray-200 p-2 text-left min-w-[100px]">
                  Date
                </th>
                <th className="border-r border-gray-200 p-2 text-left min-w-[80px]">
                  Time (min)
                </th>
                {survey.answers?.map((answer: any, index: number) => (
                  <th
                    key={answer.questionId}
                    className="border-r border-gray-200 p-2 text-left min-w-[200px] max-w-[300px]"
                  >
                    <div className="truncate" title={answer.questionText}>
                      Q{index + 1}: {answer.questionText}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedResponses.length > 0 ? (
                paginatedResponses.map((response) => (
                  <tr key={response.id} className="border-b hover:bg-muted/50">
                    <td className="sticky left-0 z-10 bg-white border-r border-gray-200 p-2 font-medium">
                      {response.respondentIdentifier ||
                        response.id.substring(0, 8)}
                    </td>
                    <td className="border-r border-gray-200 p-2 whitespace-nowrap">
                      {new Date(response.responseDate).toLocaleDateString()}
                    </td>
                    <td className="border-r border-gray-200 p-2">
                      {response.timeTakenMinutes || 0}
                    </td>
                    {survey.answers?.map((answer: any) => (
                      <td
                        key={answer.questionId}
                        className="border-r border-gray-200 p-2 max-w-[300px]"
                      >
                        <div
                          className="truncate"
                          title={
                            Array.isArray(response.answers?.[answer.questionId])
                              ? (
                                  response.answers[
                                    answer.questionId
                                  ] as string[]
                                ).join(", ")
                              : String(
                                  response.answers?.[answer.questionId] || "",
                                )
                          }
                        >
                          {Array.isArray(response.answers?.[answer.questionId])
                            ? (
                                response.answers[answer.questionId] as string[]
                              ).join(", ")
                            : String(
                                response.answers?.[answer.questionId] || "",
                              )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3 + (survey.answers?.length || 0)}
                    className="border-gray-200 p-8 text-center text-muted-foreground"
                  >
                    {isLoading
                      ? "Loading responses..."
                      : "No responses submitted yet. Responses will appear here once influencers submit the survey."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {totalResponses} responses
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-muted-foreground">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1.5 bg-background"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
