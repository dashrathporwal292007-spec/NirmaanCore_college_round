import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const STORAGE_KEY = 'nexus_platform_state_v1';
const ACTIVE_WORKSPACE_KEY = 'nexus_active_workspace_v1';

const WORKSPACES = [
  {
    id: 'acme',
    name: 'Acme Corp',
    description: 'Main business operations',
  },
  {
    id: 'marketing',
    name: 'Marketing Team',
    description: 'Campaigns and lead management',
  },
  {
    id: 'webinars',
    name: 'Webinar Operations',
    description: 'Webinars and registrations',
  },
  {
    id: 'demo',
    name: 'Demo Workspace',
    description: 'Testing and experimentation',
  },
];

// --------------------------------------------------
// INITIAL DATA
// --------------------------------------------------

const INITIAL_CONTACTS = [
  {
    id: 'ct-1',
    name: 'Elena Rostova',
    initials: 'ER',
    email: 'elena.rostova@vertexai.io',
    company: 'Vertex AI',
    status: 'Customer',
    score: 98,
    source: 'Webinar #EVT-8820',
    tags: ['enterprise', 'decision-maker'],
    activity: '2m ago • Registered Webinar',
    avatarGradient: 'from-secondary to-primary-container text-on-primary',
  },
  {
    id: 'ct-2',
    name: 'Marcus Chen',
    initials: 'MC',
    email: 'm.chen@apextechnologies.com',
    company: 'Apex Tech',
    status: 'Qualified',
    score: 86,
    source: 'Inbound Form',
    tags: ['tech-lead', 'trial-active'],
    activity: '14m ago • Viewed Pricing',
    avatarGradient: 'bg-surface-container-high text-primary',
  },
  {
    id: 'ct-3',
    name: 'Sarah Jenkins',
    initials: 'SJ',
    email: 'sarah.j@novadesign.co',
    company: 'Nova Design',
    status: 'Lead',
    score: 72,
    source: 'Webinar #EVT-8820',
    tags: ['agency', 'marketing'],
    activity: '1h ago • AI Campaign Opened',
    avatarGradient: 'bg-surface-container text-secondary',
  },
  {
    id: 'ct-4',
    name: 'David Kalu',
    initials: 'DK',
    email: 'd.kalu@cloudscale.net',
    company: 'CloudScale',
    status: 'Qualified',
    score: 91,
    source: 'Product Hunt',
    tags: ['founder', 'high-intent'],
    activity: '3h ago • Replied to Email',
    avatarGradient: 'bg-surface-container-high text-primary',
  },
  {
    id: 'ct-5',
    name: 'Sophia Martinez',
    initials: 'SM',
    email: 'smartinez@biohealth.org',
    company: 'BioHealth Group',
    status: 'Inactive',
    score: 45,
    source: 'Outbound AI',
    tags: ['healthcare', 'stalled'],
    activity: '5d ago • No response',
    avatarGradient: 'bg-surface-container-low text-outline',
  },
  {
    id: 'ct-6',
    name: 'Alexandre Dubois',
    initials: 'AD',
    email: 'a.dubois@quantumsys.eu',
    company: 'Quantum Systems',
    status: 'Customer',
    score: 94,
    source: 'Webinar #EVT-8820',
    tags: ['europe', 'vip'],
    activity: '1d ago • Upgraded to Pro',
    avatarGradient: 'from-primary to-secondary text-on-primary',
  },
  {
    id: 'ct-7',
    name: 'Amina Al-Mansoor',
    initials: 'AA',
    email: 'amina@dubai-ai.ae',
    company: 'Dubai AI Hub',
    status: 'Qualified',
    score: 88,
    source: 'Inbound Form',
    tags: ['mena', 'gov-tech'],
    activity: '2d ago • Requested Security Whitepaper',
    avatarGradient: 'bg-surface-container-high text-primary',
  },
];

const INITIAL_WEBINAR = {
  id: 'EVT-8820',
  title: 'AI-Powered Growth Masterclass',
  subtitle: 'AI for Modern Builders',
  dateFormatted: 'May 28 • 2:00 PM EST',
  capacity: 800,
  seatsClaimed: 684,
  status: 'Registration Open',
  imageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB5GhW0FanBeVbVvvwJ--PDyBIHncb6lfs0LEUvksWyN5n9i2FAGLsMeGaDXEokdSvcBNRWCJyna3ENoUfrrtTLvNhTU9Z0naZ6Np1E8w47wEsH68WMYfz10evZv9FXzp6rgWkM3JQwhzedJi7vKpQWys_zg-qSxQ50KsNM1WEMEQp4a6xWeUnt-TmD8JFeUZXDArmye0Fsu_XtfhqtnTHSA5-u77LAUkG463b9XzL5LXC1Kl09mJ-iWw',
  landingPageUrl: '/events/ai-students',
};

const INITIAL_PIPELINE = {
  id: 'PL-9904',
  objective: 'Student Webinar Funnel',
  status: 'paused_for_approval',
  computeLatency: '~45s total',
  steps: [
    {
      id: 1,
      order: 1,
      name: 'Create Webinar',
      module: 'Webinars',
      icon: 'videocam',
      status: 'completed',
      timeAgo: '2m ago',
      description:
        'Configured session "AI for Modern Builders", capacity target 100 students, scheduled for June 4 with 4 curriculum milestones.',
      requiresApproval: false,
    },
    {
      id: 2,
      order: 2,
      name: 'Generate Landing Page',
      module: 'Websites',
      icon: 'language',
      status: 'completed',
      timeAgo: 'Completed',
      description:
        'Deployed registration endpoint with Modern SaaS template layout.',
      previewUrl: '/events/ai-students',
      requiresApproval: false,
    },
    {
      id: 3,
      order: 3,
      name: 'Prepare Campaign',
      module: 'Marketing',
      icon: 'campaign',
      status: 'pending_approval',
      timeAgo: 'Pending Review',
      description:
        'Generate personalized promotional email copy and queue target student audience blast.',
      requiresApproval: true,
      approvalReason:
        'Sensitive Action Intercepted: Human authorization is required prior to email dispatch according to Acme policy.',
    },
    {
      id: 4,
      order: 4,
      name: 'Connect CRM',
      module: 'CRM',
      icon: 'groups',
      status: 'ready',
      timeAgo: 'Ready to Run',
      description:
        'Attach incoming registrant stream to contact records and apply #edu-discount metadata.',
      requiresApproval: false,
    },
    {
      id: 5,
      order: 5,
      name: 'Prepare Follow-up',
      module: 'Marketing',
      icon: 'campaign',
      status: 'blocked',
      timeAgo: 'Blocked by Step 3',
      description:
        'Schedule 24-hour pre-event automated reminder nudge and post-session code pack distribution.',
      requiresApproval: false,
    },
  ],
};

const INITIAL_APPROVALS = [
  {
    id: 'appr-101',
    pipelineId: 'PL-9904',
    stepId: 3,
    title: 'Send promotional email to 684 registrants',
    requestedBy: 'AI Business Agent',
    requestedAgo: '24m ago',
    status: 'pending',
    module: 'Marketing Automation',
    recipientCount: 684,
  },
];

const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'CRM synced 42 new attendees',
    highlight: '42 new attendees',
    meta: '3m ago • HubSpot Connector',
    icon: 'sync_alt',
    iconColor: 'text-primary',
  },
  {
    id: 'act-2',
    title: 'Landing page published',
    url: 'nexus.app/ai-masterclass',
    meta: '18m ago • Web Builder Engine',
    icon: 'public',
    iconColor: 'text-secondary',
  },
  {
    id: 'act-3',
    title: 'Campaign draft generated',
    meta: '42m ago • Generative Copy Agent',
    icon: 'edit_note',
    iconColor: 'text-tertiary',
  },
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-1',
    entityName: 'AI for Modern Builders',
    meta: 'Entity #EVT-8820 • Synced',
    badge: 'Webinars',
    badgeType: 'neutral',
  },
  {
    id: 'aud-2',
    entityName: 'Landing Page Template',
    meta: 'Live preview compiled',
    badge: 'View',
    badgeType: 'action',
    actionUrl: '/events/ai-students',
  },
  {
    id: 'aud-3',
    entityName: 'Email Campaign Draft',
    meta: 'Draft #CP-401 saved in queue',
    badge: 'Staged',
    badgeType: 'warning',
  },
  {
    id: 'aud-4',
    entityName: 'CRM Pipeline Rule',
    meta: 'Rule #R-12 active on inbound',
    badge: 'Active',
    badgeType: 'success',
  },
];

const INITIAL_PROMPT =
  'Create an AI webinar for 100 students, generate a registration page, prepare a promotional campaign, and track registrations in the CRM.';

// --------------------------------------------------
// WORKFLOW HELPERS
// --------------------------------------------------

function classifyPrompt(prompt) {
  const text = (prompt || '').toLowerCase();

  const needsWebinar =
    /\b(webinar|event|masterclass)\b/.test(text);

  const needsCRM =
    /\b(crm|contact|contacts|registrant|registrants|registration|registrations|lead|leads)\b/.test(
      text
    );

  const needsMarketing =
    /\b(marketing|campaign|email|emails|promotion|promotional|follow-up|followup|reminder)\b/.test(
      text
    );

  const needsWebsite =
    /\b(landing page|registration page|website|web page|webpage)\b/.test(
      text
    );

  const needsFollowUp =
    /\b(follow-up|followup|reminder|reminders|nurture)\b/.test(text);

  const needsContactCreation =
    /\b(add|create|import|capture|collect|register)\b.{0,60}\b(contacts?|leads?|registrants?|attendees|registrations?)\b/.test(
      text
    ) ||
    /\b(contacts?|leads?|registrants?|attendees|registrations?)\b.{0,60}\b(add|create|import|capture|collect|register)\b/.test(
      text
    );

  const needsRegistrationTracking =
    /\b(track|manage|sync|save|record)\b.{0,60}\b(registrations?|registrants?|attendees)\b/.test(
      text
    );

  return {
    needsWebinar,
    needsCRM,
    needsMarketing,
    needsWebsite,
    needsFollowUp,
    needsContactCreation,
    needsRegistrationTracking,
  };
}

function buildWorkflow(prompt) {
  const requirements = classifyPrompt(prompt);

  const steps = [];
  let nextId = 1;

  const addStep = ({
    name,
    module,
    icon,
    description,
    status = 'ready',
    requiresApproval = false,
    previewUrl,
  }) => {
    steps.push({
      id: nextId,
      order: nextId,
      name,
      module,
      icon,
      status,
      timeAgo:
        status === 'completed'
          ? 'Prepared in demo'
          : requiresApproval
            ? 'Pending Review'
            : 'Ready to Run',
      description,
      requiresApproval,
      ...(previewUrl ? { previewUrl } : {}),
    });

    nextId += 1;
  };

  if (requirements.needsWebinar) {
    addStep({
      name: 'Prepare Webinar',
      module: 'Webinars',
      icon: 'videocam',
      description:
        'Prepare the webinar configuration for the requested event.',
      status: 'completed',
    });
  }

  if (requirements.needsWebsite || requirements.needsWebinar) {
    addStep({
      name: 'Prepare Landing Page',
      module: 'Websites',
      icon: 'language',
      description:
        'Prepare a registration or landing page preview for the requested workflow.',
      status: 'completed',
      previewUrl: '/events/ai-students',
    });
  }

  if (requirements.needsMarketing) {
    addStep({
      name: 'Prepare Marketing Campaign',
      module: 'Marketing',
      icon: 'campaign',
      description:
        'Prepare the campaign draft for review. No emails will be sent automatically.',
      status: 'pending_approval',
      requiresApproval: true,
    });
  }

  if (
    requirements.needsCRM ||
    requirements.needsContactCreation ||
    requirements.needsRegistrationTracking
  ) {
    addStep({
      name: 'Prepare CRM Updates',
      module: 'CRM',
      icon: 'groups',
      description:
        'Prepare the requested CRM or registration updates for the demo workflow.',
      status: 'ready',
    });
  }

  if (requirements.needsFollowUp) {
    addStep({
      name: 'Prepare Follow-up',
      module: 'Marketing',
      icon: 'schedule',
      description:
        'Prepare follow-up tasks for review. No external messages will be sent.',
      status: 'ready',
    });
  }

  if (steps.length === 0) {
    addStep({
      name: 'Review Business Request',
      module: 'Business Operations',
      icon: 'auto_awesome',
      description:
        'Review the request and identify the next appropriate business action.',
      status: 'ready',
    });
  }

  return {
    requirements,
    steps,
    needsApproval: steps.some((step) => step.requiresApproval),
  };
}

// --------------------------------------------------
// WORKSPACE-SPECIFIC DEMO DATA
// --------------------------------------------------

function createInitialWorkspaceState(workspaceId) {
  const contacts = INITIAL_CONTACTS.map((contact) => ({ ...contact }));

  let workspaceData = {
    contacts,
    webinar: { ...INITIAL_WEBINAR },
    pipeline: {
      ...INITIAL_PIPELINE,
      steps: INITIAL_PIPELINE.steps.map((step) => ({ ...step })),
    },
    approvals: INITIAL_APPROVALS.map((approval) => ({ ...approval })),
    activities: INITIAL_ACTIVITIES.map((activity) => ({ ...activity })),
    auditLogs: INITIAL_AUDIT_LOGS.map((log) => ({ ...log })),
    promptText: INITIAL_PROMPT,
    hasRunWorkflow: true,
    lastPlanGeneratedAt: new Date().toISOString(),
  };

  if (workspaceId === 'marketing') {
    workspaceData = {
      ...workspaceData,
      contacts: [
        {
          ...contacts[2],
          id: 'marketing-ct-1',
          name: 'Priya Sharma',
          initials: 'PS',
          email: 'priya@brightmedia.example',
          company: 'Bright Media',
          status: 'Qualified',
          score: 93,
          source: 'Marketing Campaign',
          tags: ['marketing', 'high-intent'],
          activity: '10m ago • Opened Campaign',
        },
        {
          ...contacts[0],
          id: 'marketing-ct-2',
          name: 'Ryan Cooper',
          initials: 'RC',
          email: 'ryan@northstar.example',
          company: 'Northstar Digital',
          status: 'Lead',
          score: 78,
          source: 'Landing Page',
          tags: ['campaign', 'inbound'],
          activity: '25m ago • Submitted Form',
        },
        {
          ...contacts[3],
          id: 'marketing-ct-3',
          name: 'Ananya Mehta',
          initials: 'AM',
          email: 'ananya@pixelworks.example',
          company: 'Pixelworks',
          status: 'Customer',
          score: 96,
          source: 'Email Campaign',
          tags: ['customer', 'vip'],
          activity: '1h ago • Converted',
        },
        {
          ...contacts[1],
          id: 'marketing-ct-4',
          name: 'Daniel Park',
          initials: 'DP',
          email: 'daniel@cloudnine.example',
          company: 'Cloud Nine',
          status: 'Lead',
          score: 67,
          source: 'Social Media',
          tags: ['social', 'prospect'],
          activity: '3h ago • Clicked Advertisement',
        },
      ],
      webinar: {
        ...INITIAL_WEBINAR,
        id: 'MKT-120',
        title: 'Digital Growth Strategy',
        subtitle: 'Campaign Performance Workshop',
        capacity: 300,
        seatsClaimed: 186,
        status: 'Scheduled',
      },
      pipeline: {
        ...INITIAL_PIPELINE,
        id: 'PL-MKT-120',
        objective: 'Marketing Campaign Pipeline',
        status: 'running',
      },
      approvals: [
        {
          ...INITIAL_APPROVALS[0],
          id: 'appr-mkt-101',
          pipelineId: 'PL-MKT-120',
          title: 'Approve digital growth campaign',
          recipientCount: 186,
        },
      ],
      activities: [
        {
          ...INITIAL_ACTIVITIES[0],
          id: 'mkt-act-1',
          title: 'Marketing audience segmented',
          highlight: '4 audience segments',
          meta: '5m ago • Marketing Workspace',
        },
        {
          ...INITIAL_ACTIVITIES[1],
          id: 'mkt-act-2',
          title: 'Campaign landing page updated',
          meta: '20m ago • Campaign Builder',
        },
      ],
      auditLogs: INITIAL_AUDIT_LOGS.map((log) => ({ ...log })),
      promptText:
        'Analyze marketing leads, prepare a digital growth campaign, and track conversions.',
    };
  }

  if (workspaceId === 'webinars') {
    workspaceData = {
      ...workspaceData,
      contacts: [
        {
          ...contacts[0],
          id: 'webinar-ct-1',
          name: 'Kavya Raman',
          initials: 'KR',
          email: 'kavya@campus.example',
          company: 'Campus AI Society',
          status: 'Qualified',
          score: 95,
          source: 'Webinar Registration',
          tags: ['student', 'registered'],
          activity: '8m ago • Registered Webinar',
        },
        {
          ...contacts[1],
          id: 'webinar-ct-2',
          name: 'Julian Vance',
          initials: 'JV',
          email: 'julian@university.example',
          company: 'University AI Group',
          status: 'Lead',
          score: 84,
          source: 'Webinar Registration',
          tags: ['student', 'prospect'],
          activity: '30m ago • Viewed Registration Page',
        },
        {
          ...contacts[2],
          id: 'webinar-ct-3',
          name: 'Maya Patel',
          initials: 'MP',
          email: 'maya@innovation.example',
          company: 'Innovation Club',
          status: 'Customer',
          score: 92,
          source: 'Attendee Follow-up',
          tags: ['attendee', 'returning'],
          activity: '2h ago • Attended Session',
        },
      ],
      webinar: {
        ...INITIAL_WEBINAR,
        id: 'EVT-WEB-210',
        title: 'AI for Student Innovators',
        subtitle: 'Webinar Operations',
        capacity: 250,
        seatsClaimed: 142,
        status: 'Registration Open',
      },
      pipeline: {
        ...INITIAL_PIPELINE,
        id: 'PL-WEB-210',
        objective: 'Student Webinar Operations',
      },
      approvals: [
        {
          ...INITIAL_APPROVALS[0],
          id: 'appr-web-101',
          pipelineId: 'PL-WEB-210',
          title: 'Approve webinar reminder campaign',
          recipientCount: 142,
        },
      ],
      activities: [
        {
          ...INITIAL_ACTIVITIES[0],
          id: 'web-act-1',
          title: 'Webinar registrations updated',
          highlight: '142 registrants',
          meta: '4m ago • Webinar Operations',
        },
        {
          ...INITIAL_ACTIVITIES[1],
          id: 'web-act-2',
          title: 'Registration page prepared',
          meta: '16m ago • Web Builder Engine',
        },
      ],
      auditLogs: INITIAL_AUDIT_LOGS.map((log) => ({ ...log })),
      promptText:
        'Prepare an AI webinar, manage registrations, and create attendee follow-up activities.',
    };
  }

  if (workspaceId === 'demo') {
    workspaceData = {
      ...workspaceData,
      contacts: [
        {
          ...contacts[4],
          id: 'demo-ct-1',
          name: 'Demo Contact One',
          initials: 'D1',
          email: 'contact1@demo.example',
          company: 'Demo Company',
          status: 'Lead',
          score: 70,
          source: 'Demo Form',
          tags: ['demo'],
          activity: 'Recently • Demo Contact',
        },
        {
          ...contacts[5],
          id: 'demo-ct-2',
          name: 'Demo Contact Two',
          initials: 'D2',
          email: 'contact2@demo.example',
          company: 'Sample Solutions',
          status: 'Qualified',
          score: 85,
          source: 'Demo Campaign',
          tags: ['demo', 'qualified'],
          activity: 'Recently • Demo Campaign',
        },
      ],
      webinar: {
        ...INITIAL_WEBINAR,
        id: 'EVT-DEMO-001',
        title: 'NEXUS Product Demonstration',
        subtitle: 'Demo Workspace',
        capacity: 50,
        seatsClaimed: 18,
        status: 'Demo Event',
      },
      pipeline: {
        ...INITIAL_PIPELINE,
        id: 'PL-DEMO-001',
        objective: 'Demo Workflow',
      },
      approvals: [],
      activities: [
        {
          id: 'demo-act-1',
          title: 'Demo workspace initialized',
          highlight: 'Demo environment',
          meta: 'Today • NEXUS Demo',
          icon: 'science',
          iconColor: 'text-primary',
        },
      ],
      auditLogs: INITIAL_AUDIT_LOGS.map((log) => ({ ...log })),
      promptText:
        'Demonstrate the NEXUS workflow using sample contacts and a test webinar.',
    };
  }

  return workspaceData;
}

function createInitialState() {
  return {
    workspaces: Object.fromEntries(
      WORKSPACES.map((workspace) => [
        workspace.id,
        createInitialWorkspaceState(workspace.id),
      ])
    ),
  };
}

function normalizeSavedState(savedState) {
  if (savedState && savedState.workspaces) {
    const normalizedWorkspaces = {};

    WORKSPACES.forEach((workspace) => {
      const storedWorkspace = savedState.workspaces[workspace.id];

      normalizedWorkspaces[workspace.id] = storedWorkspace
        ? {
            ...createInitialWorkspaceState(workspace.id),
            ...storedWorkspace,
          }
        : createInitialWorkspaceState(workspace.id);
    });

    return { workspaces: normalizedWorkspaces };
  }

  const initial = createInitialState();

  if (savedState && Array.isArray(savedState.contacts)) {
    initial.workspaces.acme = {
      ...initial.workspaces.acme,
      ...savedState,
    };
  }

  return initial;
}

// --------------------------------------------------
// CONTEXT
// --------------------------------------------------

const NexusContext = createContext(null);

export function NexusProvider({ children }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    try {
      const savedWorkspace = localStorage.getItem(
        ACTIVE_WORKSPACE_KEY
      );

      return WORKSPACES.some(
        (workspace) => workspace.id === savedWorkspace
      )
        ? savedWorkspace
        : 'acme';
    } catch {
      return 'acme';
    }
  });

  const [allWorkspaceStates, setAllWorkspaceStates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        return normalizeSavedState(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load saved NEXUS state:', error);
    }

    return createInitialState();
  });

  const state =
    allWorkspaceStates.workspaces[activeWorkspaceId] ||
    allWorkspaceStates.workspaces.acme;

  const activeWorkspace =
    WORKSPACES.find(
      (workspace) => workspace.id === activeWorkspaceId
    ) || WORKSPACES[0];

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(allWorkspaceStates)
      );
    } catch (error) {
      console.warn('Failed to save NEXUS state:', error);
    }
  }, [allWorkspaceStates]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_WORKSPACE_KEY,
        activeWorkspaceId
      );
    } catch (error) {
      console.warn('Failed to save active workspace:', error);
    }
  }, [activeWorkspaceId]);

  // --------------------------------------------------
  // WORKSPACE ACTIONS
  // --------------------------------------------------

  const switchWorkspace = (workspaceId) => {
    const exists = WORKSPACES.some(
      (workspace) => workspace.id === workspaceId
    );

    if (!exists) {
      console.warn(`Unknown NEXUS workspace: ${workspaceId}`);
      return;
    }

    setActiveWorkspaceId(workspaceId);
  };

  const updateActiveWorkspace = (updater) => {
    setAllWorkspaceStates((previous) => {
      const currentWorkspace =
        previous.workspaces[activeWorkspaceId] ||
        createInitialWorkspaceState(activeWorkspaceId);

      const updatedWorkspace =
        typeof updater === 'function'
          ? updater(currentWorkspace)
          : { ...currentWorkspace, ...updater };

      return {
        ...previous,
        workspaces: {
          ...previous.workspaces,
          [activeWorkspaceId]: updatedWorkspace,
        },
      };
    });
  };

  // --------------------------------------------------
  // DERIVED METRICS
  // --------------------------------------------------

  const totalContacts = state.contacts.length;

  const qualifiedContacts = state.contacts.filter(
    (contact) => contact.status === 'Qualified'
  ).length;

  const customerContacts = state.contacts.filter(
    (contact) => contact.status === 'Customer'
  ).length;

  const leadContacts = state.contacts.filter(
    (contact) => contact.status === 'Lead'
  ).length;

  const pendingApprovalsCount = state.approvals.filter(
    (approval) => approval.status === 'pending'
  ).length;

  const activeCampaignsCount =
    12 +
    (state.pipeline.steps.some(
      (step) =>
        step.module === 'Marketing' &&
        step.status === 'completed'
    )
      ? 1
      : 0);

  const completedStepsCount = state.pipeline.steps.filter(
    (step) => step.status === 'completed'
  ).length;

  const totalStepsCount = state.pipeline.steps.length;

  const workflowRate =
    totalStepsCount > 0
      ? (
          (completedStepsCount / totalStepsCount) *
          100
        ).toFixed(1)
      : '0.0';

  // --------------------------------------------------
  // ACTION: EXECUTE / PLAN AI PROMPT
  // --------------------------------------------------

  const executePlan = (prompt) => {
    const text = (prompt || state.promptText || '').trim();

    if (!text) return;

    const { requirements, steps, needsApproval } =
      buildWorkflow(text);

    const pipelineId = `PL-${Date.now()}`;

    const pipelineStatus = needsApproval
      ? 'paused_for_approval'
      : 'ready';

    const newPipeline = {
      ...INITIAL_PIPELINE,
      id: pipelineId,
      objective: requirements.needsWebinar
        ? 'Webinar Operations Workflow'
        : requirements.needsCRM
          ? 'CRM Management Workflow'
          : requirements.needsMarketing
            ? 'Marketing Automation Workflow'
            : requirements.needsWebsite
              ? 'Website Creation Workflow'
              : 'Business Operations Workflow',
      status: pipelineStatus,
      computeLatency: 'Demo workflow',
      steps: steps.map((step) => ({
        ...step,
        pipelineId,
      })),
    };

    const approvalStep = steps.find(
      (step) => step.requiresApproval
    );

    const newApproval = approvalStep
      ? {
          id: `appr-${Date.now()}`,
          pipelineId,
          stepId: approvalStep.id,
          title:
            approvalStep.module === 'Marketing'
              ? 'Approve marketing campaign'
              : `Approve ${approvalStep.name.toLowerCase()}`,
          requestedBy: 'NEXUS Business Agent',
          requestedAgo: 'Just now',
          status: 'pending',
          module: approvalStep.module,
          recipientCount: 0,
          shouldAddContacts: false,
        }
      : null;

    const newActivity = {
      id: `act-${Date.now()}`,
      title: 'AI Workflow Prepared',
      highlight: newPipeline.objective,
      meta: 'Just now • NEXUS Workflow Engine',
      icon: 'auto_awesome',
      iconColor: 'text-primary',
    };

    updateActiveWorkspace((previous) => ({
      ...previous,
      promptText: text,
      hasRunWorkflow: true,
      pipeline: newPipeline,
      approvals: newApproval
        ? [
            newApproval,
            ...previous.approvals.filter(
              (approval) => approval.status === 'pending'
            ),
          ]
        : previous.approvals.filter(
            (approval) => approval.status !== 'pending'
          ),
      activities: [
        newActivity,
        ...previous.activities.slice(0, 9),
      ],
      lastPlanGeneratedAt: new Date().toISOString(),
    }));
  };

  // --------------------------------------------------
  // ACTION: APPROVE SENSITIVE ACTION
  // --------------------------------------------------

  const approveAction = (approvalId) => {
    updateActiveWorkspace((previous) => {
      const approval = previous.approvals.find(
        (item) => item.id === approvalId
      );

      if (!approval || approval.status !== 'pending') {
        return previous;
      }

      const updatedApprovals = previous.approvals.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              status: 'approved',
              decidedAt: 'Just now',
            }
          : item
      );

      // Only complete the step associated with this approval.
      const updatedSteps = previous.pipeline.steps.map((step) => {
        if (
          step.id === approval.stepId &&
          previous.pipeline.id === approval.pipelineId
        ) {
          return {
            ...step,
            status: 'completed',
            timeAgo: 'Approved in demo',
          };
        }

        return step;
      });

      const pipelineHasPendingApprovals = updatedApprovals.some(
        (item) =>
          item.pipelineId === approval.pipelineId &&
          item.status === 'pending'
      );

      const pipelineStatus = pipelineHasPendingApprovals
        ? 'paused_for_approval'
        : updatedSteps.some(
              (step) =>
                step.status === 'ready' ||
                step.status === 'blocked' ||
                step.status === 'pending_approval'
            )
          ? 'ready'
          : 'completed';

      const timestamp = Date.now();

      // CRM records are created only if the approval explicitly
      // requests contact creation. Campaign approval alone does
      // not create contacts.
      const newAttendees =
        approval.shouldAddContacts === true
          ? [
              {
                id: `ct-auto-${timestamp}-1`,
                name: 'Kavya Raman',
                initials: 'KR',
                email: 'kavya.r@mit.edu',
                company: 'MIT AI Lab',
                status: 'Qualified',
                score: 95,
                source: 'Webinar Registration',
                tags: ['#edu-discount', 'student-scholarship'],
                activity: 'Just now • Demo workflow',
                avatarGradient:
                  'from-secondary to-primary text-on-primary',
              },
              {
                id: `ct-auto-${timestamp}-2`,
                name: 'Julian Vance',
                initials: 'JV',
                email: 'j.vance@stanford.edu',
                company: 'Stanford AI Group',
                status: 'Lead',
                score: 84,
                source: 'Webinar Registration',
                tags: ['#edu-discount'],
                activity: 'Just now • Demo workflow',
                avatarGradient:
                  'bg-surface-container-high text-primary',
              },
            ]
          : [];

      const newAuditLogs = [
        {
          id: `aud-${timestamp}-1`,
          entityName: `${approval.title} Approved`,
          meta: 'Simulated approval • No external action performed',
          badge: 'Demo',
          badgeType: 'success',
        },
        ...(newAttendees.length > 0
          ? [
              {
                id: `aud-${timestamp}-2`,
                entityName: 'Demo Contacts Added',
                meta: `${newAttendees.length} sample contacts inserted into CRM`,
                badge: 'Synced',
                badgeType: 'success',
              },
            ]
          : []),
        ...previous.auditLogs,
      ];

      const newActivities = [
        {
          id: `act-${timestamp}-1`,
          title: 'Approval completed',
          highlight: approval.title,
          meta: 'Just now • NEXUS Demo Environment',
          icon: 'verified',
          iconColor: 'text-primary',
        },
        ...(newAttendees.length > 0
          ? [
              {
                id: `act-${timestamp}-2`,
                title: 'Sample contacts added to CRM',
                highlight: newAttendees
                  .map((contact) => contact.name)
                  .join(', '),
                meta: 'Just now • Demo CRM',
                icon: 'groups',
                iconColor: 'text-secondary',
              },
            ]
          : []),
        ...previous.activities,
      ];

      const isRegistrationApproval =
        approval.shouldAddContacts === true;

      return {
        ...previous,

        approvals: updatedApprovals,

        pipeline: {
          ...previous.pipeline,
          status: pipelineStatus,
          steps: updatedSteps,
        },

        contacts:
          newAttendees.length > 0
            ? [...newAttendees, ...previous.contacts]
            : previous.contacts,

        auditLogs: newAuditLogs.slice(0, 8),

        activities: newActivities.slice(0, 10),

        // Seat counts change only when a registration-related
        // action explicitly creates attendee records.
        webinar: isRegistrationApproval
          ? {
              ...previous.webinar,
              seatsClaimed: Math.min(
                previous.webinar.capacity,
                previous.webinar.seatsClaimed + newAttendees.length
              ),
            }
          : previous.webinar,
      };
    });
  };

  // --------------------------------------------------
  // ACTION: ADD CONTACT
  // --------------------------------------------------

  const addContact = (contactData) => {
    const initials =
      contactData.name
        .split(' ')
        .map((namePart) => namePart[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CT';

    const timestamp = Date.now();

    const newContact = {
      id: `ct-${timestamp}`,
      name: contactData.name,
      initials,
      email: contactData.email,
      company: contactData.company || 'Direct Contact',
      status: contactData.status || 'Lead',
      score: Math.floor(60 + Math.random() * 38),
      source: contactData.source || 'Inbound Form',
      tags: Array.isArray(contactData.tags)
        ? contactData.tags
        : typeof contactData.tags === 'string'
          ? contactData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : ['inbound'],
      activity: 'Just now • Added manually',
      avatarGradient:
        'from-secondary to-primary text-on-primary',
    };

    const newActivity = {
      id: `act-${timestamp}`,
      title: `Contact created: ${newContact.name}`,
      highlight: newContact.company,
      meta: 'Just now • CRM User Action',
      icon: 'person_add',
      iconColor: 'text-primary',
    };

    updateActiveWorkspace((previous) => ({
      ...previous,
      contacts: [newContact, ...previous.contacts],
      activities: [
        newActivity,
        ...previous.activities.slice(0, 9),
      ],
    }));

    return newContact;
  };

  // --------------------------------------------------
  // ACTION: RESET DEMO
  // --------------------------------------------------

  const resetDemoState = () => {
    const freshState = createInitialState();

    setAllWorkspaceStates(freshState);
    setActiveWorkspaceId('acme');

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, 'acme');
    } catch (error) {
      console.warn('Failed to reset saved NEXUS state:', error);
    }
  };

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = {
    ...state,

    workspaces: WORKSPACES,
    activeWorkspace,
    activeWorkspaceId,
    switchWorkspace,

    totalContacts,
    qualifiedContacts,
    customerContacts,
    leadContacts,
    pendingApprovalsCount,
    activeCampaignsCount,
    workflowRate,

    executePlan,
    approveAction,
    addContact,
    resetDemoState,

    setPromptText: (text) =>
      updateActiveWorkspace((previous) => ({
        ...previous,
        promptText: text,
      })),
  };

  return (
    <NexusContext.Provider value={value}>
      {children}
    </NexusContext.Provider>
  );
}

export function useNexus() {
  const context = useContext(NexusContext);

  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }

  return context;
}