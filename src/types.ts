export interface ResponseItem {
  question: string;
  response: string | null;
}

export interface PageDetail {
  page: number;
  text: string;
  question_hints?: string[];
  confidence?: number;
}

export interface FileResult {
  filename: string;
  responses: ResponseItem[];
  pages?: PageDetail[];
}

export interface ExtractionResponse {
  results: FileResult[];
}

export interface SampleExam {
  id: string;
  title: string;
  filename: string;
  description: string;
  questions: string[];
}

export interface TestResultItem {
  name: string;
  category: string;
  input: string;
  expected?: string;
  matchedQuestion?: string;
  passed: boolean;
  notes: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  timestamp: string;
}
