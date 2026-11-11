// Single source of truth for everything the site lists.
// Adding a post, a merged pull request or a repository is one entry here;
// the pages render from these arrays, so nothing can drift between them.

export const profile = {
  name: 'Harkanwal Bedi',
  role: 'Staff Forward Deployed AI Engineer',
  company: 'Google',
  location: 'Seattle, WA',
  github: 'https://github.com/harkanwalbedi',
  medium: 'https://medium.com/@harkanwalbedi',
  linkedin: 'https://www.linkedin.com/in/harkanwalbedi/',
};

export interface Post {
  title: string;
  summary: string;
  /** ISO date (YYYY-MM-DD) the post went live on Medium. */
  date: string;
  /** Position in a series, e.g. "Part 2 of 4". */
  part?: string;
  url: string;
}

// Medium is the only copy of each post. Titles, dates and links mirror what is
// published there. Newest first.
export const posts: Post[] = [
  {
    title: 'Inside System 1 Models',
    summary: 'How a transformer stops writing text and starts providing calibrated decisions.',
    date: '2026-10-29',
    part: 'Part 2 of 4',
    url: 'https://harkanwalbedi.medium.com/inside-system-1-models-e36c0b30c8a9',
  },
  {
    title: 'Thinking, Fast and Slow for Production Agents',
    summary:
      'Pairing open-weights System 1 decision models with an LLM so every model plays to its strengths.',
    date: '2026-10-14',
    part: 'Part 1 of 4',
    url: 'https://harkanwalbedi.medium.com/thinking-fast-and-slow-for-production-agents-03e5d0f87cc2',
  },
];

export interface MergedPullRequest {
  /** GitHub organisation or user that owns the repository. */
  owner: string;
  repo: string;
  number: number;
  summary: string;
  /** ISO date (YYYY-MM-DD) the pull request was merged upstream. */
  mergedAt: string;
  language: string;
  /** First upstream release that contains the change, when there is one. */
  release?: string;
}

// Only pull requests that have been merged upstream belong here. Newest first.
export const mergedPullRequests: MergedPullRequest[] = [
  {
    owner: 'ggml-org',
    repo: 'llama.cpp',
    number: 30779,
    summary:
      'llama-server now visits parent slots before their child slots, so requests that share a prompt prefix no longer need a third forward pass.',
    mergedAt: '2026-11-07',
    language: 'C++',
    release: 'b12188',
  },
  {
    owner: 'AI-Hypercomputer',
    repo: 'maxdiffusion',
    number: 476,
    summary:
      'Skips the CUDA-only nvidia-cuda-cccl dependency on macOS, where no wheels exist, so local installs no longer fail on Apple Silicon.',
    mergedAt: '2026-11-06',
    language: 'Python',
  },
];

export interface Repository {
  name: string;
  summary: string;
  kind: string;
}

export const repositories: Repository[] = [
  {
    name: 'vertex-llm-benchmark',
    summary:
      'Terraform and pipeline harness to benchmark LLM serving latency, throughput, and capacity sizing on Vertex AI.',
    kind: 'Terraform · Vertex AI',
  },
  {
    name: 'continuous-training-vertex-ai',
    summary: 'End-to-end Continuous Training (CT) MLOps pipeline on Google Cloud Vertex AI.',
    kind: 'MLOps · Vertex AI',
  },
  {
    name: 'pdf-wizard',
    summary:
      'Toolkit and evaluation suite for automated AcroForm PDF filling and structured document workflows with Gemini.',
    kind: 'Python · Gemini',
  },
  {
    name: 'gemini-model-availability-checker',
    summary:
      'Verify Gemini model and regional availability across Google AI Studio, Vertex AI, and Gemini Enterprise.',
    kind: 'Python · Gemini',
  },
  {
    name: 'vertexai-llm-notebooks',
    summary:
      'Applied Vertex AI notebooks for RAG, embedding dimension tuning, text-to-SQL, and Enterprise Search with Gemini.',
    kind: 'Jupyter · Vertex AI',
  },
];

export function pullRequestUrl(pr: MergedPullRequest): string {
  return `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`;
}

export function repositoryUrl(repo: Repository): string {
  return `${profile.github}/${repo.name}`;
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-11-07" -> "Nov 7, 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}
