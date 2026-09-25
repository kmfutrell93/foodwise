/**
 * Medical / nutrition sources cited in FoodWise (Guideline 1.4.1).
 * Only include real, verifiable URLs that support the claims we surface in-app.
 */

export type SourceCategory =
  | 'protein'
  | 'muscle_glp1'
  | 'gi_nausea'
  | 'general';

export type Citation = {
  id: string;
  category: SourceCategory;
  title: string;
  authors: string;
  detail: string;
  url: string;
  /** What FoodWise recommendation this backs */
  backs: string;
};

export const CITATIONS: Citation[] = [
  {
    id: 'issn-protein-2017',
    category: 'protein',
    title: 'ISSN Position Stand: Protein and Exercise',
    authors: 'Jäger et al., Journal of the International Society of Sports Nutrition (2017)',
    detail:
      'Supports higher daily protein intake (about 1.4–2.0 g/kg body weight) to help maintain muscle mass — a range that often lands near 100–130g/day for many adults.',
    url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8',
    backs: 'Daily protein target guidance (100–130g)',
  },
  {
    id: 'issn-bodycomp-2017',
    category: 'protein',
    title: 'ISSN Position Stand: Diets and Body Composition',
    authors: 'Aragon et al., Journal of the International Society of Sports Nutrition (2017)',
    detail:
      'Notes that higher protein intakes during a calorie deficit can help maximize retention of lean mass.',
    url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0174-y',
    backs: 'Protein for muscle preservation during weight loss',
  },
  {
    id: 'nih-ods-protein',
    category: 'protein',
    title: 'NIH ODS: Dietary Supplements for Exercise and Athletic Performance',
    authors: 'National Institutes of Health, Office of Dietary Supplements',
    detail:
      'Summarizes that protein helps build, maintain, and repair muscle, and that athletes commonly need about 1.2–2.0 g/kg/day (roughly 75–135g for a 150 lb person).',
    url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/',
    backs: 'Protein role in muscle maintenance',
  },
  {
    id: 'dga-2020',
    category: 'general',
    title: 'Dietary Guidelines for Americans, 2020–2025',
    authors: 'U.S. Department of Agriculture & U.S. Department of Health and Human Services',
    detail:
      'Federal dietary guidance emphasizing nutrient-dense eating patterns, including adequate protein foods as part of a healthy diet.',
    url: 'https://odphp.health.gov/our-work/nutrition-physical-activity/dietary-guidelines/previous-dietary-guidelines/2020',
    backs: 'General nutrition framework',
  },
  {
    id: 'step1-nejm',
    category: 'muscle_glp1',
    title: 'Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1)',
    authors: 'Wilding et al., New England Journal of Medicine (2021)',
    detail:
      'Semaglutide produced substantial weight loss; body-composition assessments showed reductions in both fat mass and lean body mass.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33567185/',
    backs: 'Lean mass can decline during GLP-1–supported weight loss',
  },
  {
    id: 'step1-dxa-pmc',
    category: 'muscle_glp1',
    title: 'Impact of Semaglutide on Body Composition (STEP 1 DXA analysis)',
    authors: 'Published analysis of the STEP 1 DXA substudy (PMC)',
    detail:
      'In the DXA substudy, absolute lean body mass decreased (~9.7%) alongside larger fat-mass reductions — illustrating why protecting lean tissue (protein + resistance training) is a clinical focus.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8089287/',
    backs: 'Lean-tissue loss observed with semaglutide weight loss',
  },
  {
    id: 'ozempic-label',
    category: 'gi_nausea',
    title: 'OZEMPIC (semaglutide) Prescribing Information',
    authors: 'U.S. Food and Drug Administration / Novo Nordisk',
    detail:
      'Lists nausea, vomiting, diarrhea, abdominal pain, and constipation among the most common adverse reactions; GI effects are often most noticeable during dose escalation.',
    url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/209637s038lbl.pdf',
    backs: 'Nausea and GI side effects on GLP-1 medication',
  },
  {
    id: 'glp1-gi-diet-pmc',
    category: 'gi_nausea',
    title: 'Dietary Recommendations for GI Symptoms with GLP-1 Receptor Agonists',
    authors: 'Gentinetta et al., Diabetes, Metabolic Syndrome and Obesity (2024)',
    detail:
      'Reviews practical dietary approaches for GI symptoms with GLP-1 RAs, including smaller meals and easier-to-tolerate food textures when nausea is present.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11668918/',
    backs: 'Softer / easier-to-digest meals when GI symptoms are elevated',
  },
];

export const CATEGORY_LABELS: Record<SourceCategory, string> = {
  protein: 'Protein & muscle preservation',
  muscle_glp1: 'Lean mass during GLP-1 weight loss',
  gi_nausea: 'GLP-1 nausea & GI symptoms',
  general: 'General nutrition guidance',
};

export const SOURCES_DISCLAIMER =
  'FoodWise is a nutrition support tool, not a medical device. Citations are provided for educational context. Always follow guidance from your doctor, dietitian, or prescribing provider.';
