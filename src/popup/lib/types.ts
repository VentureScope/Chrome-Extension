export type UserSession = {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  tokenType: string; // "Bearer"
  loginTime: string;
};

export type TranscriptConfig = {
  gpa_scale: number;
  grading_schema: Record<string, number | null>;
  grade_display_order: string[];
};

export type ScrapedCourse = {
  code: string;
  name?: string;
  title?: string;
  grade: string;
  credits: number;
  points?: number | null;
  semester?: string;
  academicYear?: string;
  yearLevel?: string | null;
};

export type UploadableCourse = {
  code: string;
  title: string;
  credit_hours: number;
  grade: string;
  points: number;
};

export type UploadableSemester = {
  academic_year: string;
  semester: string;
  year_level: string | null;
  courses: UploadableCourse[];
  semester_summary: {
    credit_hours: number;
    points: number;
    sgpa: number;
    academic_status: string | null;
  };
  cumulative_summary: {
    credit_hours: number;
    points: number;
    cgpa: number;
  };
};

export type TranscriptCreatePayload = {
  transcript_data: {
    student_id: string;
    semesters: UploadableSemester[];
  };
};

export type AcademicData = {
  studentId: string | null;
  name: string | null;
  email: string | null;
  department: string | null;
  year: string | null;
  status: string | null;
  gpa: string | null;
  courses: ScrapedCourse[];
  transcriptData?: {
    student_id: string | null;
    semesters: UploadableSemester[];
  };
  extractedFrom?: string;
  extractedAt?: string;
  syncTime?: string;
  backend?: {
    upload?: unknown;
    latest?: unknown;
  };
};

