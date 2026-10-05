/**
 * Pre-configured Executive Demo Resumes with realistic details,
 * skills, timeline, and SVG avatars for instant QR generation & scanning.
 */

// Helper to generate sleek avatar SVGs
function createAvatarSvg(name, bg1, bg2) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="grad_${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="80" fill="url(#grad_${initials})" />
    <circle cx="80" cy="62" r="32" fill="rgba(255,255,255,0.22)" />
    <path d="M30 145 C30 105, 130 105, 130 145 Z" fill="rgba(255,255,255,0.22)" />
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Sample dummy PDF file data URL (Minimal valid PDF 1.4 document)
const SAMPLE_PDF_BASE64 = `data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCAxMjkKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRECihBbGV4IE1vcmdhbiAtIFJlc3VtZSkgVGoKL0YxIDE0IFRmCjAgLTMwIFRECihMYXN0IFVwZGF0ZWQ6IDIwMjYpIFRqCjAgLTMwIFRECihTY2FuIFFSIENvZGUgb24gUmVzdW1lUVIgdG8gdmlldyBmdWxsIGludGVyYWN0aXZlIHBvcnRmb2xpbykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjQ5IDAwMDAwIG4gCjAwMDAwMDA0MjkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgowMDAwMDAwNTE2CiUlRU9GCg==`;

export const DEMO_RESUMES = [
  {
    id: 'demo_alex_morgan',
    fullName: 'Alex Morgan',
    headline: 'Staff Full-Stack Engineer & Cloud Architect',
    email: 'alex.morgan.dev@gmail.com',
    phone: '+1 (415) 890-2341',
    location: 'San Francisco, CA (Hybrid / Remote)',
    linkedin: 'https://linkedin.com/in/alexmorgan',
    github: 'https://github.com/alexmorgan',
    website: 'https://alexmorgan.dev',
    avatar: createAvatarSvg('Alex Morgan', '#6366f1', '#06b6d4'),
    summary: 'Seasoned Software Architect and Full-Stack Engineering Leader with 8+ years designing high-throughput distributed microservices, ultra-responsive web applications, and resilient cloud architectures. Proven record of scaling systems to 25M+ active users while reducing latency by 42% and cloud costs by $450K/yr.',
    skills: [
      'React & Next.js',
      'TypeScript',
      'Node.js & Go',
      'Kubernetes & Docker',
      'AWS / GCP Architecture',
      'PostgreSQL & Redis',
      'System Design',
      'GraphQL & REST',
      'CI/CD & DevOps',
      'Micro-Frontends'
    ],
    experience: [
      {
        role: 'Staff Software Engineer & Technical Lead',
        company: 'Veloce Cloud Systems',
        period: '2022 - Present',
        description: 'Led architecture for real-time telemetry pipeline processing 4.2B daily events. Spearheaded migration from legacy monolith to decoupled Go microservices, improving 99th-percentile response times from 340ms to 48ms. Mentored 14 senior engineers across 3 distributed pods.'
      },
      {
        role: 'Senior Full-Stack Engineer',
        company: 'Apex Data Labs',
        period: '2019 - 2022',
        description: 'Architected next-generation enterprise analytics dashboard using React, TypeScript, and WebSockets. Implemented automated end-to-end testing pipelines and zero-downtime Blue/Green deployments across AWS ECS clusters.'
      },
      {
        role: 'Full-Stack Developer',
        company: 'Kinetic Studio',
        period: '2017 - 2019',
        description: 'Engineered high-converting fintech client applications, integrated Stripe & Plaid payment gateways, and achieved 99.98% uptime SLA compliance.'
      }
    ],
    education: [
      {
        degree: 'B.S. in Computer Science & Engineering',
        school: 'University of California, Berkeley',
        year: '2013 - 2017'
      },
      {
        degree: 'AWS Certified Solutions Architect – Professional',
        school: 'Amazon Web Services (AWS)',
        year: 'Credential ID: AWS-PSA-98214'
      }
    ],
    projects: [
      {
        name: 'NexusPulse Engine',
        tech: 'Go, Kafka, Redis, ClickHouse',
        description: 'Distributed event ingestion engine handling 120,000 requests/sec with sub-millisecond serialization and memory-efficient streaming buffers.'
      },
      {
        name: 'HyperReact UI Framework',
        tech: 'React 19, TypeScript, Vanilla CSS',
        description: 'Open-source design system component library with over 4,500 GitHub stars and 120k monthly npm downloads.'
      }
    ],
    fileName: 'Alex_Morgan_Resume_2026.pdf',
    fileType: 'application/pdf',
    fileSize: '1.4 MB',
    fileData: SAMPLE_PDF_BASE64,
    scans: 14,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },

  {
    id: 'demo_sophia_chen',
    fullName: 'Sophia Chen',
    headline: 'Principal Product Designer & UX Strategist',
    email: 'sophia.chen.design@outlook.com',
    phone: '+1 (212) 654-7890',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/sophiachen',
    github: 'https://github.com/sophiachen-design',
    website: 'https://sophiachen.design',
    avatar: createAvatarSvg('Sophia Chen', '#ec4899', '#8b5cf6'),
    summary: 'Award-winning Principal Product Designer with 9+ years crafting transformative digital experiences for enterprise SaaS and consumer apps. Obsessed with design systems, human-computer interaction, and data-driven accessibility. Redesigned core checkout flows that surged client conversion rates by 28%.',
    skills: [
      'Design Systems & Tokens',
      'Figma & Prototyping',
      'User Research & Usability Testing',
      'Information Architecture',
      'Interaction & Motion Design',
      'WCAG 2.2 AAA Accessibility',
      'HTML/CSS & Storybook',
      'Product Strategy'
    ],
    experience: [
      {
        role: 'Principal Product Designer',
        company: 'Luminary Technologies',
        period: '2021 - Present',
        description: 'Direct design strategy for 4 multi-platform product suites. Standardized unified cross-platform design token architecture utilized by 60+ engineers, cutting feature design-to-production turnaround by 40%.'
      },
      {
        role: 'Senior UX/UI Designer',
        company: 'FinSphere Digital',
        period: '2018 - 2021',
        description: 'Conducted 120+ user research sessions and redesigned consumer mobile wealth app, driving App Store rating from 3.6 to 4.8 stars.'
      }
    ],
    education: [
      {
        degree: 'M.S. in Human-Computer Interaction (HCI)',
        school: 'Carnegie Mellon University',
        year: '2016 - 2018'
      },
      {
        degree: 'B.F.A. in Graphic & Interactive Design',
        school: 'Rhode Island School of Design (RISD)',
        year: '2012 - 2016'
      }
    ],
    projects: [
      {
        name: 'Prism Design System',
        tech: 'Figma Tokens, CSS Variables, React',
        description: 'Comprehensive design system featuring 140+ accessible components, dark/light adaptive themes, and interactive motion guidelines.'
      }
    ],
    fileName: 'Sophia_Chen_Portfolio_CV.pdf',
    fileType: 'application/pdf',
    fileSize: '3.2 MB',
    fileData: SAMPLE_PDF_BASE64,
    scans: 28,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },

  {
    id: 'demo_david_miller',
    fullName: 'David Miller, Ph.D.',
    headline: 'Head of Applied AI & Machine Learning',
    email: 'd.miller.ai@mit.edu',
    phone: '+1 (617) 432-8901',
    location: 'Boston, MA / Cambridge',
    linkedin: 'https://linkedin.com/in/davidmiller-ai',
    github: 'https://github.com/davidmiller-ml',
    website: 'https://davidmiller.ai',
    avatar: createAvatarSvg('David Miller', '#10b981', '#3b82f6'),
    summary: 'Machine Learning Scientist & Research Director specializing in LLM fine-tuning, retrieval-augmented generation (RAG), multimodal foundation models, and scalable GPU cluster training infrastructure. Published 12+ papers at NeurIPS, ICML, and CVPR with over 3,200 citations.',
    skills: [
      'PyTorch & JAX',
      'LLM Fine-Tuning & RLHF',
      'RAG & Vector Databases',
      'CUDA & Distributed Training',
      'Python & C++',
      'Model Quantization (vLLM)',
      'MLOps & MLflow',
      'Computer Vision'
    ],
    experience: [
      {
        role: 'Director of AI Research',
        company: 'Cognitive Frontiers AI',
        period: '2023 - Present',
        description: 'Leading a team of 18 PhD research scientists developing proprietary domain-specific reasoning models. Optimized inference engine latency by 3.8x using TensorRT-LLM and FlashAttention-3 kernels.'
      },
      {
        role: 'Senior Staff Research Scientist',
        company: 'Vector Dynamics Labs',
        period: '2019 - 2023',
        description: 'Trained large-scale multimodal vision-language models on 512x H100 GPU clusters with automated fault tolerance and pipeline parallelism.'
      }
    ],
    education: [
      {
        degree: 'Ph.D. in Computer Science (Artificial Intelligence)',
        school: 'Massachusetts Institute of Technology (MIT)',
        year: '2015 - 2019'
      }
    ],
    projects: [
      {
        name: 'FlashVector-RAG',
        tech: 'Python, Rust, C++, PyTorch',
        description: 'High-speed approximate nearest neighbor vector indexing engine achieving 4x throughput over standard HNSW baselines.'
      }
    ],
    fileName: 'Dr_David_Miller_AI_Curriculum_Vitae.pdf',
    fileType: 'application/pdf',
    fileSize: '2.1 MB',
    fileData: SAMPLE_PDF_BASE64,
    scans: 41,
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];
