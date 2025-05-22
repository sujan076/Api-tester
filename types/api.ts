export interface ApiResponse {
  validation: "Pass" | "Fail";
  discrepancies: string;
  test_id: string;
  generated_op: any;
  expected_op: any;
  endpoint: string;
  bug_title: string;
  status_code: number;
}

// Interface for a single mapping entry between a key and file indices
export interface FileMapperEntry {
  [key: string]: number[]; // Key mapped to array of file indices
}

// Interface for the complete file mapper structure
export interface FileIndicesMapping {
  fileMapper: FileMapperEntry[];
  files: File[]; // Array of all uploaded files
}
