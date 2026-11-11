export type Category = { id: string; name: string; slug: string };
export type Course = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary: string;
  outcomes: string[];
  course_type: "Certificate" | "Diploma";
  duration_minutes: number;
  status: string;
  edition: number;
  categories?: Category;
};
export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  position: number;
  required: boolean;
  duration_minutes: number;
};
export type Module = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};
export type Assessment = {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  position: number;
  required: boolean;
  pass_mark: number;
};
export type Attempt = {
  id: string;
  assessment_id: string;
  enrollment_id: string;
  score: number;
  passed: boolean;
  submitted_at: string;
};
export type Enrollment = {
  id: string;
  course_id: string;
  user_id: string;
  last_lesson_id: string | null;
  completed_at: string | null;
  enrolled_at: string;
};
export type Certificate = {
  id: string;
  enrollment_id: string;
  verification_code: string;
  learner_name: string;
  course_title: string;
  issuer: string;
  issued_at: string;
};
export type DraftQuestion = {
  prompt: string;
  options: string[];
  correct_index: number | null;
};
export type DraftAssessment = {
  title: string;
  module_position: number | null;
  required: boolean;
  pass_mark: number;
  questions: DraftQuestion[];
};
export type DraftLesson = {
  title: string;
  markdown: string;
  video_url: string | null;
  required: boolean;
  duration_minutes: number;
};
export type DraftModule = { title: string; lessons: DraftLesson[] };
export type Draft = Omit<Course, "categories" | "id"> & {
  id?: string;
  modules: DraftModule[];
  assessments: DraftAssessment[];
};
