export type SourceType = "github" | "docs" | "blog" | "video" | "profile" | "other";

export interface AgentConfig {
  llmProvider: "openai" | "anthropic";
  llmApiKey: string;
  llmModel: string;
  tinyfishApiKey?: string;
  tinyfishEndpoint?: string;
  wundergraphEndpoint?: string;
  ghostAdminUrl?: string;
  ghostAdminKey?: string;
  databaseUrl?: string;
}

export interface RawPage {
  url: string;
  html: string;
  status: number;
  fetchedBy: "tinyfish" | "fetch";
  fetchedAt: string;
}

export interface ExtractedContent {
  url: string;
  source: SourceType;
  title: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  metadata: Record<string, string>;
}

export interface StructuredSource {
  source: SourceType;
  url: string;
  title: string;
  content: string;
  sections: { heading: string; body: string }[];
  entities: string[];
  claims: string[];
}

export interface CompanyProfile {
  name: string;
  category: string;
  problem: string;
  solution: string;
  capabilities: string[];
  differentiators: string[];
  audience: string;
  summary: string;
}

export interface AnswerBlock {
  question: string;
  answer: string;
  sources: string[];
}

export interface PodcastScript {
  title: string;
  intro: string;
  segments: { speaker: string; text: string }[];
  outro: string;
}

export interface InfluencerOutreach {
  influencer_persona: string;
  platform: string;
  subject: string;
  message: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  body_markdown: string;
}

export interface GeneratedContent {
  faq: AnswerBlock[];
  blog: BlogPost;
  podcast: PodcastScript;
  outreach: InfluencerOutreach[];
}

export interface JobStep {
  name: string;
  status: "running" | "done" | "warn" | "error" | "skip";
  detail?: string;
  at: string;
}

export interface AnalysisJob {
  id: string;
  createdAt: string;
  status: "pending" | "running" | "complete" | "error";
  company: string;
  urls: string[];
  steps: JobStep[];
  sources: StructuredSource[];
  profile?: CompanyProfile;
  answerBlocks: AnswerBlock[];
  content?: GeneratedContent;
  ghost?: { published: boolean; url?: string; note?: string };
  error?: string;
}
