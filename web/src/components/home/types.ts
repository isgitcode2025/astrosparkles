export type AstrologerStats = {
  total: number;
  online: number;
  women: number;
  consultations: number;
  maxExperienceYears: number;
  byConcern: Record<string, number>;
  byLanguage: Record<string, number>;
};
