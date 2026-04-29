import type { AcademicData, TranscriptCreatePayload, TranscriptConfig, UploadableSemester } from "./types";
import { normalizeStudentId } from "./normalize";

export function buildTranscriptCreatePayload(
  data: AcademicData,
  transcriptConfig: TranscriptConfig,
): TranscriptCreatePayload {
  const resolvedStudentId = normalizeStudentId(
    data?.transcriptData?.student_id || data?.studentId || "",
  );

  if (data?.transcriptData?.semesters?.length) {
    return {
      transcript_data: {
        student_id: resolvedStudentId,
        semesters: normalizeScrapedSemesters(data.transcriptData.semesters),
      },
    };
  }

  const grouped = groupCoursesBySemester(data.courses || []);
  const semesters: UploadableSemester[] = [];
  let cumulativeCredits = 0;
  let cumulativePoints = 0;

  Object.entries(grouped as Record<string, any[]>).forEach(([semesterName, semesterCourses]: [string, any[]], index) => {
    const validCourses = semesterCourses.filter((course: any) => Number(course.credits || 0) > 0);
    if (!validCourses.length) return;

    const creditHours = validCourses.reduce((sum: number, course: any) => sum + Number(course.credits || 0), 0);
    const points = validCourses.reduce((sum: number, course: any) => {
      const value = transcriptConfig.grading_schema?.[course.grade];
      const gradePoint = typeof value === "number" ? value : 0;
      return sum + Number(course.credits || 0) * gradePoint;
    }, 0);

    cumulativeCredits += creditHours;
    cumulativePoints += points;

    const sgpa = creditHours > 0 ? Number((points / creditHours).toFixed(2)) : 0;
    const cgpa =
      cumulativeCredits > 0 ? Number((cumulativePoints / cumulativeCredits).toFixed(2)) : 0;

    semesters.push({
      academic_year: index === 0 ? "2024/2025" : "2025/2026",
      semester: semesterName,
      year_level: String(data.year || "").trim() || null,
      courses: validCourses.map((course: any) => ({
        code: String(course.code || ""),
        title: String(course.name || course.title || ""),
        credit_hours: Number(course.credits || 0),
        grade: String(course.grade || "-"),
        points:
          typeof transcriptConfig.grading_schema?.[course.grade] === "number"
            ? Number(
                (
                  Number(course.credits || 0) * (transcriptConfig.grading_schema[course.grade] as number)
                ).toFixed(2),
              )
            : 0,
      })),
      semester_summary: {
        credit_hours: Number(creditHours.toFixed(2)),
        points: Number(points.toFixed(2)),
        sgpa,
        academic_status: String(data.status || "Active"),
      },
      cumulative_summary: {
        credit_hours: Number(cumulativeCredits.toFixed(2)),
        points: Number(cumulativePoints.toFixed(2)),
        cgpa: Number(cgpa.toFixed(2)),
      },
    });
  });

  return { transcript_data: { student_id: resolvedStudentId, semesters } };
}

export function normalizeScrapedSemesters(semesters: any[]): UploadableSemester[] {
  return (semesters || [])
    .map((semester) => {
      const courses = (semester.courses || [])
        .map((course: any) => ({
          code: String(course.code || "").trim(),
          title: String(course.title || course.name || "").trim(),
          credit_hours: Number(course.credit_hours ?? course.credits ?? 0),
          grade: String(course.grade || "-").trim(),
          points:
            course.points === null || course.points === undefined || Number.isNaN(Number(course.points))
              ? 0
              : Number(course.points),
        }))
        .filter(
          (course: any) =>
            course.code && course.title && Number.isFinite(course.credit_hours) && course.credit_hours > 0,
        );

      const semesterCreditHours =
        Number(semester.semester_summary?.credit_hours) ||
        courses.reduce((sum: number, c: any) => sum + Number(c.credit_hours || 0), 0);
      const semesterPoints =
        Number(semester.semester_summary?.points) ||
        courses.reduce((sum: number, c: any) => sum + Number(c.points || 0), 0);
      const sgpa =
        Number(semester.semester_summary?.sgpa) ||
        (semesterCreditHours > 0 ? Number((semesterPoints / semesterCreditHours).toFixed(2)) : 0);

      const cumulativeCreditHours =
        Number(semester.cumulative_summary?.credit_hours) || Number(semesterCreditHours);
      const cumulativePoints =
        Number(semester.cumulative_summary?.points) || Number(semesterPoints);
      const cgpa =
        Number(semester.cumulative_summary?.cgpa) ||
        (cumulativeCreditHours > 0 ? Number((cumulativePoints / cumulativeCreditHours).toFixed(2)) : 0);

      const rawYearLevel = String(semester.year_level || "").trim();
      const rawAcademicStatus = String(semester.semester_summary?.academic_status || "").trim();

      return {
        academic_year: String(semester.academic_year || "").trim(),
        semester: String(semester.semester || "").trim(),
        year_level: rawYearLevel || null,
        courses,
        semester_summary: {
          credit_hours: Number(semesterCreditHours.toFixed(2)),
          points: Number(semesterPoints.toFixed(2)),
          sgpa: Number(sgpa.toFixed(2)),
          academic_status: rawAcademicStatus || null,
        },
        cumulative_summary: {
          credit_hours: Number(cumulativeCreditHours.toFixed(2)),
          points: Number(cumulativePoints.toFixed(2)),
          cgpa: Number(cgpa.toFixed(2)),
        },
      } satisfies UploadableSemester;
    })
    .filter(
      (semester: any) =>
        semester.academic_year &&
        semester.semester &&
        semester.courses.length > 0 &&
        Number.isFinite(semester.semester_summary.sgpa) &&
        Number.isFinite(semester.cumulative_summary.cgpa),
    );
}

function groupCoursesBySemester(courses: any[]) {
  return (courses || []).reduce((groups, course) => {
    const semester = course.semester || "First Semester";
    if (!groups[semester]) groups[semester] = [];
    groups[semester].push(course);
    return groups;
  }, {} as Record<string, any[]>);
}

