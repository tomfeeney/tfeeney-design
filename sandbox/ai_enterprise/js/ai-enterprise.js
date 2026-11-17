(() => {
  "use strict";

  const APP_VERSION = "v1.8";
  const STORAGE_KEY = "ai-ncc-1701:lastAnalysis";
  const SESSION_STORAGE_KEY = "ai-ncc-1701:savedSessions";
  const LEGACY_STORAGE_KEY = "signaldesk:lastAnalysis";
    function buildApiEndpoints() {
    const endpoints = [];
    const add = (url) => {
      if (!url || endpoints.includes(url)) return;
      endpoints.push(url);
    };
    const pageBase = new URL(".", window.location.href);
    add(new URL("api/analyze.php", pageBase).href);
    document.querySelectorAll("script[src]").forEach((script) => {
      const src = script.getAttribute("src") || "";
      if (!src.includes("ai-enterprise.js")) return;
      const scriptUrl = new URL(src, window.location.href);
      add(new URL("../api/analyze.php", scriptUrl).href);
      add(new URL("../../api/analyze.php", scriptUrl).href);
    });
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      add(new URL("api/analyze", pageBase).href);
      add("/api/analyze");
    }
    return endpoints;
  }
  const API_ENDPOINTS = buildApiEndpoints();
  const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
  const MAX_SOURCE_CHARS = 40000;

  const scenarioSamples = {
    support: `Enterprise dashboard filters fail intermittently after region is changed. Account managers say this is blocking QBR prep for several high-value customers.
Mobile checkout flow shows a blank confirmation state for some users after payment approval. Support has multiple urgent tickets and customers are worried they were charged twice.
Customer says analytics export is too slow and times out when pulling more than 90 days of data. The team needs this for monthly executive reporting.
Support escalation: multiple customers report checkout confirmation never appears after payment approval, creating duplicate charge anxiety.
Feature request: add saved views for frequently used dashboard filters. Multiple users mentioned this would reduce repetitive setup time.`,
    qa: `QA found that new map validation tags are not saving consistently. This creates rework and may allow incorrect geo updates to move forward.
Release candidate issue: keyboard users cannot complete the account-permissions modal because focus escapes behind the overlay.
Regression note: enterprise export downloads pass for small datasets but fail when the date range exceeds 90 days.
Bug bash finding: saved dashboard views disappear after switching from North America to EMEA and refreshing the page.
QA concern: workflow status changes can be submitted without a confirmation state, making it unclear whether the publish action completed.`,
    research: `Research synthesis: account managers rely on saved dashboard configurations before QBRs, but they rebuild the same filters every week.
Usability study: users do not understand the difference between "pending review" and "ready to publish" in the workflow status labels.
Customer interview: analytics exports are trusted more than dashboard screenshots, so timeouts are blocking executive reporting rituals.
Design feedback: permission-editing modals feel high-risk because users cannot easily confirm who will be affected.
Research note: teams want AI suggestions, but only if the system shows evidence and lets them edit ownership before assignment.`,
    incident: `Incident update: data sync delay caused stale inventory values for enterprise accounts. No data loss confirmed, but operations team is manually checking affected records.
Executive escalation: two strategic customers saw stale availability data during renewal discussions and requested an incident summary.
Operations note: support is manually cross-checking affected records while engineering investigates the sync queue delay.
Data platform update: retry jobs are clearing, but the team has not confirmed whether all regional caches refreshed.
Customer communications draft: teams need one accountable owner, a verified blast radius, and a clear next update time.`
  };

  const sampleSignals = scenarioSamples.support;

  const $ = (selector) => document.querySelector(selector);
  const state = {
    analysis: null,
    reviewed: false,
    sources: [],
    expanded: new Set(),
    filters: {
      search: "",
      priority: "all",
      owner: "all",
      status: "all",
      cluster: "all",
      confidence: "all",
      matrix: "all",
      sort: "priorityDesc"
    },
    viewMode: "table",
    currentStep: 1
  };

  const el = {
    html: document.documentElement,
    hero: $("#heroSection"),
    inputPanel: $("#inputPanel"),
    processingPanel: $("#processingPanel"),
    processingProgressBar: $("#processingProgressBar"),
    processingStageList: $("#processingStageList"),
    processingStageCount: $("#processingStageCount"),
    inputReadinessPanel: $("#inputReadinessPanel"),
    inputReadinessTitle: $("#inputReadinessTitle"),
    inputReadinessCopy: $("#inputReadinessCopy"),
    readinessSignalText: $("#readinessSignalText"),
    readinessSources: $("#readinessSources"),
    readinessUrl: $("#readinessUrl"),
    sourceUrlValidation: $("#sourceUrlValidation"),
    recommendedNextMove: $("#recommendedNextMove"),
    generatedArtifactPanel: $("#generatedArtifactPanel"),
    generatedArtifactMessage: $("#generatedArtifactMessage"),
    stepCards: document.querySelectorAll(".workflow-step-card"),
    step3Panel: $("#step3Panel"),
    input: $("#signalInput"),
    sourceUrlInput: $("#sourceUrlInput"),
    addUrl: $("#addUrlBtn"),
    sourceTray: $("#sourceTray"),
    fileInput: $("#documentUploadInput"),
    fileDropZone: $("#fileDropZone"),
    chooseFiles: $("#chooseFilesBtn"),
    fileDropStatus: $("#fileDropStatus"),
    analyze: $("#analyzeBtn"),
    sample: $("#loadSampleBtn"),
    sampleTop: $("#loadSampleTop"),
    clear: $("#clearBtn"),
    aiReviewPanel: $("#aiReviewPanel"),
    clusterPanel: $("#clusterPanel"),
    signalBreakdownPanel: $("#signalBreakdownPanel"),
    theme: $("#themeToggle"),
    reviewed: $("#markReviewedBtn"),
    export: $("#exportBtn"),
    exportAuditReport: $("#exportAuditReportBtn"),
    copySummary: $("#copySummaryBtn"),
    copySlack: $("#copySlackBtn"),
    copyEmailBrief: $("#copyEmailBriefBtn"),
    copyTopJira: $("#copyTopJiraBtn"),
    copyReviewedActions: $("#copyReviewedActionsBtn"),
    copyHandoff: $("#copyHandoffBtn"),
    exportCsv: $("#exportCsvBtn"),
    exportMarkdown: $("#exportMarkdownBtn"),
    saveSession: $("#saveSessionBtn"),
    sessionSelect: $("#sessionSelect"),
    savedSessionList: $("#savedSessionList"),
    savedSessionCount: $("#savedSessionCount"),
    loadSession: $("#loadSessionBtn"),
    deleteSession: $("#deleteSessionBtn"),
    diagnosticMode: $("#diagnosticMode"),
    diagnosticRoute: $("#diagnosticRoute"),
    diagnosticModel: $("#diagnosticModel"),
    diagnosticTimestamp: $("#diagnosticTimestamp"),
    diagnosticMessage: $("#diagnosticMessage"),
    reviewBadge: $("#reviewBadge"),
    status: $("#aiStatus"),
    dot: $("#statusDot"),
    signalCount: $("#signalCount"),
    highCount: $("#highCount"),
    confidence: $("#confidence"),
    clusterCount: $("#clusterCount"),
    statHigh: $("#statHigh"),
    statDesign: $("#statDesign"),
    statEngineering: $("#statEngineering"),
    statCustomer: $("#statCustomer"),
    statHighMeta: $("#statHighMeta"),
    statDesignMeta: $("#statDesignMeta"),
    statEngineeringMeta: $("#statEngineeringMeta"),
    statCustomerMeta: $("#statCustomerMeta"),
    statHighBar: $("#statHighBar"),
    statDesignBar: $("#statDesignBar"),
    statEngineeringBar: $("#statEngineeringBar"),
    statCustomerBar: $("#statCustomerBar"),
    priorityCard: $("#priorityCard"),
    impactCard: $("#impactCard"),
    ownerCard: $("#ownerCard"),
    confidenceCard: $("#confidenceCard"),
    overallPriority: $("#overallPriority"),
    priorityReason: $("#priorityReason"),
    primaryImpact: $("#primaryImpact"),
    primaryOwner: $("#primaryOwner"),
    summaryConfidence: $("#summaryConfidence"),
    summaryText: $("#summaryText"),
    nextStep: $("#nextStep"),
    whyText: $("#whyText"),
    decisionReadout: $("#decisionReadout"),
    reviewProgressLabel: $("#reviewProgressLabel"),
    reviewProgressBar: $("#reviewProgressBar"),
    actionPlanList: $("#actionPlanList"),
    actionPlanBadge: $("#actionPlanBadge"),
    readinessScore: $("#readinessScore"),
    beforeAfterText: $("#beforeAfterText"),
    handoffReadinessText: $("#handoffReadinessText"),
    priorityChart: $("#priorityChart"),
    ownerChart: $("#ownerChart"),
    confidenceChart: $("#confidenceChart"),
    priorityChartReadout: $("#priorityChartReadout"),
    ownerChartReadout: $("#ownerChartReadout"),
    confidenceChartReadout: $("#confidenceChartReadout"),
    priorityMatrix: $("#priorityMatrix"),
    table: $("#signalTable"),
    search: $("#signalSearchInput"),
    priorityFilter: $("#priorityFilter"),
    ownerFilter: $("#ownerFilter"),
    statusFilter: $("#statusFilter"),
    clusterFilter: $("#clusterFilter"),
    clusterList: $("#clusterList"),
    clusterBadge: $("#clusterBadge"),
    sortSelect: $("#sortSelect"),
    clearFilters: $("#clearFiltersBtn"),
    continueToActions: $("#continueToActionsBtn"),
    continueToActionsBottom: $("#continueToActionsBottomBtn"),
    saveSignal: $("#saveSignalBtn"),
    saveSignalName: $("#saveSignalNameInput"),
    useDefaultSignalName: $("#useDefaultSignalNameBtn"),
    saveSignalValidation: $("#saveSignalValidation"),
    startNewSignal: $("#startNewSignalBtn"),
    emailRecipients: $("#emailRecipientsInput"),
    emailValidationMessage: $("#emailValidationMessage"),
    emailSubject: $("#emailSubjectInput"),
    emailBody: $("#emailBodyInput"),
    slackPreview: $("#slackPreview"),
    jiraPreview: $("#jiraPreview"),
    executivePreview: $("#executivePreview"),
    tableView: $("#tableViewBtn"),
    boardView: $("#boardViewBtn"),
    tableViewWrap: $("#tableViewWrap"),
    reviewBoard: $("#reviewBoard"),
    drawer: $("#infoDrawer"),
    drawerBackdrop: $("#drawerBackdrop"),
    drawerClose: $("#drawerClose"),
    drawerTitle: $("#drawerTitle"),
    toast: $("#appToast"),
    toastBody: $("#toastBody")
  };

  const localTerms = {
    high: ["urgent", "critical", "blocking", "incident", "outage", "data loss", "security", "privacy", "charged twice", "revenue", "high-value", "incorrect", "stale", "risk", "compliance"],
    design: ["design", "confusing", "unclear", "label", "workflow", "status", "modal", "focus", "accessibility", "saved views", "filters", "research"],
    engineering: ["fail", "blank", "timeout", "not saving", "sync", "stale", "data", "keyboard", "payment", "export", "intermittently", "api", "bug"],
    customer: ["support", "tickets", "customer", "customers", "account managers", "multiple users", "worried", "checkout", "payment", "user"]
  };

  const clusterRules = [
    { id: "cluster-checkout-payment", title: "Checkout / payment confidence", keywords: ["checkout", "payment", "charged", "charge", "confirmation", "blank"], reason: "Payment and confirmation-state signals point to a shared checkout trust issue." },
    { id: "cluster-dashboard-filters", title: "Dashboard filters / saved views", keywords: ["dashboard", "filter", "filters", "saved view", "saved views", "qbr"], reason: "Dashboard filter friction and saved-view requests are related workflow-efficiency signals." },
    { id: "cluster-analytics-export", title: "Analytics export / reporting", keywords: ["analytics", "export", "report", "reporting", "90 days", "executive"], reason: "Reporting/export issues appear connected to executive reporting and account-team workflows." },
    { id: "cluster-data-sync", title: "Data sync / stale values", keywords: ["sync", "stale", "inventory", "data delay", "data quality"], reason: "Signals indicate potential data freshness or data-quality workflow risk." },
    { id: "cluster-accessibility-modal", title: "Accessibility / modal interaction", keywords: ["accessibility", "keyboard", "focus", "modal", "permissions"], reason: "Keyboard focus and modal interaction signals belong in an accessibility review group." },
    { id: "cluster-map-validation", title: "Map validation / QA integrity", keywords: ["map", "validation", "tags", "geo", "qa"], reason: "Map validation and QA-saving issues suggest a common data-integrity workflow." },
    { id: "cluster-status-language", title: "Workflow status language", keywords: ["pending review", "ready to publish", "status", "labels", "workflow"], reason: "Status-label confusion signals an information architecture and workflow clarity issue." }
  ];

  const priorityOptions = ["High", "Medium", "Low"];
  const ownerOptions = ["Product", "Design", "Engineering", "Support", "QA", "Operations", "Security", "Data Platform", "Research"];
  const statusOptions = ["Escalate", "Needs Review", "UX Review", "Validate", "Triage", "Monitor", "Backlog", "Accepted", "Edited", "Assigned", "Resolved"];

  const supportedFileExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".md", ".markdown", ".json"];
  const browserReadableExtensions = [".txt", ".md", ".markdown", ".csv", ".json"];

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function trunc(value, length = 160) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    return text.length <= length ? text : `${text.slice(0, length).trim()}…`;
  }

  function clamp(number, min, max) {
    return Math.max(min, Math.min(max, Number(number) || min));
  }

  function slugId(prefix = "src") {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
  }

  function intakeHasContent() {
    return Boolean(
      state.analysis ||
      state.sources.length ||
      (el.input?.value || "").trim() ||
      (el.sourceUrlInput?.value || "").trim()
    );
  }

  function sourceCountText() {
    const files = state.sources.filter((source) => source.type !== "url").length;
    const draftUrl = (el.sourceUrlInput?.value || "").trim();
    const urls = state.sources.filter((source) => source.type === "url").length + (draftUrl && isCompleteUrl(draftUrl) ? 1 : 0);
    const pasted = (el.input?.value || "").trim().length > 0;
    const parts = [];
    if (files) parts.push(`${files} file${files === 1 ? "" : "s"}`);
    if (urls) parts.push(`${urls} URL${urls === 1 ? "" : "s"}`);
    if (pasted) parts.push("pasted signal text");
    if (!parts.length) return ".txt, .md, .csv, and .json files are read directly in the browser. PDF, DOCX, and XLSX files are attached as source metadata until server-side parsing is connected.";
    return `Current intake includes ${parts.join(", ")}.`;
  }

  function sourceCounts() {
    const draftUrl = (el.sourceUrlInput?.value || "").trim();
    return {
      files: state.sources.filter((source) => source.type !== "url").length,
      urls: state.sources.filter((source) => source.type === "url").length + (draftUrl && isCompleteUrl(draftUrl) ? 1 : 0),
      pastedText: (el.input?.value || "").trim().length > 0
    };
  }

  function isCompleteUrl(value) {
    const text = String(value || "").trim();
    if (!text) return true;
    if (/\s/.test(text)) return false;
    const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    try {
      const url = new URL(candidate);
      return Boolean(url.hostname && url.hostname.includes(".") && url.hostname.length > 3);
    } catch {
      return false;
    }
  }

  function emailListIsValid(value) {
    const text = String(value || "").trim();
    if (!text) return false;
    const emails = text.split(",").map((item) => item.trim()).filter(Boolean);
    if (!emails.length) return false;
    return emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }

  function setReadinessItem(item, stateName) {
    if (!item) return;
    item.classList.remove("is-good", "is-watch", "is-bad");
    item.classList.add(`is-${stateName}`);
  }

  function updateInputReadiness() {
    const counts = sourceCounts();
    const pastedLength = (el.input?.value || "").trim().length;
    const hasSourceDraft = (el.sourceUrlInput?.value || "").trim().length > 0;
    const urlOk = isCompleteUrl(el.sourceUrlInput?.value || "");
    const hasAnySource = counts.files > 0 || counts.urls > 0;
    const ready = pastedLength > 0 || hasAnySource || (hasSourceDraft && urlOk);

    if (el.inputReadinessTitle) {
      el.inputReadinessTitle.textContent = ready ? "Ready for triage" : "Needs a signal";
    }
    if (el.inputReadinessCopy) {
      if (ready) {
        const sourceBits = [];
        if (pastedLength) sourceBits.push("pasted signal text");
        if (counts.files) sourceBits.push(`${counts.files} file${counts.files === 1 ? "" : "s"}`);
        if (counts.urls) sourceBits.push(`${counts.urls} URL${counts.urls === 1 ? "" : "s"}`);
        el.inputReadinessCopy.textContent = `Ready to run with ${sourceBits.join(", ")}.`;
      } else if (hasSourceDraft && !urlOk) {
        el.inputReadinessCopy.textContent = "The source URL needs a complete domain before it can be added or used.";
      } else {
        el.inputReadinessCopy.textContent = "Add pasted text, a complete URL, or a supporting file before running triage.";
      }
    }
    setReadinessItem(el.readinessSignalText, pastedLength ? "good" : "watch");
    setReadinessItem(el.readinessSources, hasAnySource ? "good" : "watch");
    setReadinessItem(el.readinessUrl, hasSourceDraft ? (urlOk ? "good" : "bad") : "watch");
    if (el.sourceUrlValidation) {
      el.sourceUrlValidation.textContent = hasSourceDraft && !urlOk ? "Use a complete URL or domain, for example https://example.com/ticket/123." : "Use a complete URL such as https://example.com/ticket/123.";
      el.sourceUrlValidation.classList.toggle("is-error", Boolean(hasSourceDraft && !urlOk));
      el.sourceUrlValidation.classList.toggle("is-success", Boolean(hasSourceDraft && urlOk));
    }
    if (el.analyze) el.analyze.disabled = !ready || Boolean(hasSourceDraft && !urlOk);
  }

  function makeDefaultSignalName() {
    const analysis = state.analysis;
    const counts = sourceCounts();
    const date = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    if (analysis?.signals?.length) {
      const pieces = [
        "Signal Review",
        analysis.overallPriority || "Priority",
        `${analysis.signalCount || analysis.signals.length} signals`,
        date
      ];
      const sourcePieces = [];
      if (counts.files) sourcePieces.push(`${counts.files} file${counts.files === 1 ? "" : "s"}`);
      if (counts.urls) sourcePieces.push(`${counts.urls} URL${counts.urls === 1 ? "" : "s"}`);
      if (counts.pastedText) sourcePieces.push("pasted text");
      if (sourcePieces.length) pieces.push(sourcePieces.join(", "));
      return pieces.join(" · ");
    }
    return `Signal Review · ${date}`;
  }

  function updateSaveSignalState() {
    if (el.useDefaultSignalName?.checked && el.saveSignalName && state.analysis) {
      el.saveSignalName.disabled = true;
      el.saveSignalName.value = makeDefaultSignalName();
    }
    const hasName = Boolean((el.saveSignalName?.value || "").trim());
    if (el.saveSignal) el.saveSignal.disabled = !hasName || !state.analysis;
    if (el.saveSignalValidation) {
      el.saveSignalValidation.textContent = hasName ? "Ready to save this named signal." : "Enter a signal name or use the default name before saving.";
      el.saveSignalValidation.classList.toggle("is-success", hasName);
      el.saveSignalValidation.classList.toggle("is-error", !hasName);
    }
  }

  function updateEmailValidationState() {
    const value = el.emailRecipients?.value || "";
    const hasValue = value.trim().length > 0;
    const valid = !hasValue || emailListIsValid(value);
    if (el.emailValidationMessage) {
      el.emailValidationMessage.textContent = hasValue
        ? (valid ? "Recipients look valid." : "Use complete email addresses, separated by commas.")
        : "Recipients are optional. The draft can open without recipients so the user can add them in their email app.";
      el.emailValidationMessage.classList.toggle("is-success", valid && hasValue);
      el.emailValidationMessage.classList.toggle("is-error", hasValue && !valid);
    }
    if (el.copyEmailBrief) el.copyEmailBrief.disabled = !state.analysis || !valid;
    return valid;
  }

  function updateIntakeStatus() {
    if (el.fileDropStatus) el.fileDropStatus.textContent = sourceCountText();
    document.body.classList.toggle("has-intake", intakeHasContent());
    updateInputReadiness();
  }

  function setResultsVisible(visible) {
    document.body.classList.toggle("has-analysis", Boolean(visible));
    if (!visible) {
      document.querySelectorAll(".workflow-result-panel").forEach((panel) => { panel.hidden = true; });
      if (el.step3Panel) el.step3Panel.hidden = true;
    }
    updateIntakeStatus();
  }

  function updateWorkflowSteps() {
    const hasAnalysis = Boolean(state.analysis);
    el.stepCards?.forEach((card) => {
      const step = Number(card.dataset.step || 1);
      card.classList.toggle("is-active", step === state.currentStep);
      card.classList.toggle("is-complete", (step === 1 && (hasAnalysis || state.currentStep > 1)) || (step === 2 && hasAnalysis && state.currentStep > 2));
      card.classList.toggle("is-locked", step > 1 && !hasAnalysis);
      card.setAttribute("aria-disabled", step > 1 && !hasAnalysis ? "true" : "false");
    });
  }

  function showStep(step = 1, options = {}) {
    const hasAnalysis = Boolean(state.analysis);
    const safeStep = hasAnalysis ? clamp(step, 1, 3) : 1;
    state.currentStep = safeStep;

    const step1Panels = [el.inputPanel];
    const step2Panels = [el.aiReviewPanel, el.clusterPanel, el.signalBreakdownPanel];
    const step3Panels = [el.step3Panel];

    step1Panels.forEach((panel) => { if (panel) panel.hidden = safeStep !== 1; });
    step2Panels.forEach((panel) => { if (panel) panel.hidden = !(safeStep === 2 && hasAnalysis); });
    step3Panels.forEach((panel) => { if (panel) panel.hidden = !(safeStep === 3 && hasAnalysis); });

    if (el.processingPanel) el.processingPanel.hidden = true;
    document.body.classList.remove("is-step-1", "is-step-2", "is-step-3");
    document.body.classList.add(`is-step-${safeStep}`);

    updateWorkflowSteps();
    updateIntakeStatus();
    if (!options.noScroll) document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setTone(element, tone) {
    if (!element) return;
    element.classList.remove("tone-danger", "tone-warning", "tone-success", "tone-neutral");
    element.classList.add(`tone-${tone || "neutral"}`);
  }

  function confidenceTone(value) {
    const score = Number(value || 0);
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "danger";
  }

  function priorityTone(value) {
    const priority = normPriority(value);
    if (priority === "High") return "danger";
    if (priority === "Medium") return "warning";
    return "success";
  }

  function ownerConcentrationTone(analysis) {
    const signals = analysis?.signals || [];
    if (!signals.length) return "neutral";
    const counts = signals.reduce((map, signal) => {
      map[signal.owner] = (map[signal.owner] || 0) + 1;
      return map;
    }, {});
    const max = Math.max(...Object.values(counts));
    const share = max / signals.length;
    if (share >= 0.5) return "danger";
    if (share >= 0.3) return "warning";
    return "success";
  }


  function setStatus(kind, message) {
    if (el.status) el.status.textContent = message;
    if (el.dot) el.dot.className = "status-dot" + (kind ? ` is-${kind}` : "");
  }

  function toast(message) {
    if (el.toastBody) el.toastBody.textContent = message;
    if (el.toast && window.bootstrap?.Toast) {
      bootstrap.Toast.getOrCreateInstance(el.toast, { delay: 3200 }).show();
    }
  }

  function normPriority(priority) {
    const value = String(priority || "").toLowerCase();
    if (value.includes("high") || value.includes("critical")) return "High";
    if (value.includes("low")) return "Low";
    return "Medium";
  }

  function priorityScore(priority) {
    return normPriority(priority) === "High" ? 3 : normPriority(priority) === "Medium" ? 2 : 1;
  }

  function getRiskScore(signal) {
    const priorityBase = { High: 72, Medium: 48, Low: 24 }[normPriority(signal.priority)] || 48;
    const confidenceLift = Math.round(clamp(signal.signalConfidence || 70, 1, 99) / 10);
    const clusterLift = Math.min(Math.max(Number(signal.clusterSize || 1) - 1, 0) * 5, 12);
    const duplicateLift = signal.duplicateGroupId ? 6 : 0;
    const risk = priorityBase + confidenceLift + clusterLift + duplicateLift;
    return clamp(risk, 1, 99);
  }

  function getRiskTone(score) {
    if (Number(score) >= 75) return "danger";
    if (Number(score) >= 50) return "warning";
    return "success";
  }

  function getRecommendedWorkflow(signal) {
    const confidence = Number(signal.signalConfidence || 0);
    const priority = normPriority(signal.priority);
    if (confidence < 65) {
      return { state: "Validate", reason: "Confidence is low enough that a human should verify the evidence before assignment." };
    }
    if (priority === "High") {
      return { state: "Escalate", reason: "High-priority signal with enough confidence to move into escalation or unblocker review." };
    }
    if (Number(signal.clusterSize || 1) > 1) {
      return { state: "Assign", reason: "Related signals appear in the same cluster, so ownership should be confirmed and assigned." };
    }
    if (priority === "Medium") {
      return { state: "Schedule", reason: "Medium-risk signal should be validated, scheduled, or routed into the next planning pass." };
    }
    return { state: "Monitor", reason: "Low-risk signal can be monitored or moved to backlog unless more evidence appears." };
  }


  function inferImpactCategory(signal) {
    const haystack = [signal.text, signal.impact, signal.owner, signal.status].join(" ").toLowerCase();
    if (/accessibility|keyboard|focus|screen reader|wcag/.test(haystack)) return "Accessibility";
    if (/revenue|checkout|payment|renewal|charged|sales|qbr/.test(haystack)) return "Revenue Risk";
    if (/compliance|privacy|security|policy|permission|audit/.test(haystack)) return "Compliance / Policy";
    if (/support|ticket|tickets|customer complaint|escalation/.test(haystack)) return "Support Load";
    if (/data|report|reporting|analytics|export|sync|stale|inventory|dashboard/.test(haystack)) return "Data / Reporting";
    if (/bug|qa|release|regression|quality|validation|not saving/.test(haystack)) return "Product Quality";
    if (/workflow|status|handoff|operations|manual|process/.test(haystack)) return "Internal Workflow";
    return /customer|user|users|account/i.test(haystack) ? "Customer Experience" : "Operational Efficiency";
  }

  function inferEffort(signal) {
    const haystack = [signal.text, signal.impact, signal.owner, signal.status].join(" ").toLowerCase();
    if (/architecture|migration|platform|system|sync|cache|data pipeline|security|permissions|payment|checkout|api/.test(haystack)) return "Large";
    if (/modal|workflow|export|dashboard|filters|saved view|validation|accessibility|qa|reporting/.test(haystack)) return "Medium";
    if (/label|copy|message|microcopy|tooltip|empty state|documentation|clarify/.test(haystack)) return "Small";
    return signal.priority === "High" ? "Medium" : "Small";
  }

  function inferSourceStrength(signal) {
    const evidenceCount = Array.isArray(signal.evidence) ? signal.evidence.length : 0;
    const questionsCount = Array.isArray(signal.openQuestions) ? signal.openQuestions.length : 0;
    if (Number(signal.clusterSize || 1) > 1 || evidenceCount >= 2 || Number(signal.signalConfidence || 0) >= 82) return "Strong";
    if (Number(signal.signalConfidence || 0) >= 65 || evidenceCount === 1 || questionsCount <= 1) return "Moderate";
    return "Weak";
  }

  function makeConfidenceReasons(signal) {
    const reasons = [];
    const confidence = Number(signal.signalConfidence || 0);
    const evidenceCount = Array.isArray(signal.evidence) ? signal.evidence.length : 0;
    if (confidence >= 80) reasons.push("High confidence because the signal has clear language, owner cues, or supporting evidence.");
    else if (confidence >= 60) reasons.push("Medium confidence because the signal is actionable but still benefits from human validation.");
    else reasons.push("Low confidence because the signal needs stronger evidence before assignment.");
    if (Number(signal.clusterSize || 1) > 1) reasons.push("Related signals appear in the same cluster, increasing pattern strength.");
    if (evidenceCount) reasons.push(`${evidenceCount} evidence point${evidenceCount === 1 ? "" : "s"} available for review.`);
    if (Array.isArray(signal.openQuestions) && signal.openQuestions.length) reasons.push("Open questions remain and should be resolved before handoff.");
    return reasons.slice(0, 4);
  }

  function makeEscalationReason(signal) {
    if (normPriority(signal.priority) !== "High" && Number(signal.riskScore || 0) < 75) {
      return "No immediate escalation required unless new evidence increases risk, scope, or customer impact.";
    }
    const parts = [];
    if (normPriority(signal.priority) === "High") parts.push("priority is high");
    if (Number(signal.riskScore || 0) >= 75) parts.push(`risk score is ${signal.riskScore}/99`);
    if (Number(signal.clusterSize || 1) > 1) parts.push("related signals suggest a repeated pattern");
    if (/revenue|customer|checkout|payment|support|incident|compliance|accessibility/i.test([signal.text, signal.impact].join(" "))) parts.push("business/customer impact is visible");
    return `Escalate because ${parts.join(", ") || "the signal may block the workflow"}.`;
  }

  function getMatrixBucket(signal) {
    const highImpact = normPriority(signal.priority) === "High" || Number(signal.riskScore || 0) >= 75 || /Revenue|Compliance|Accessibility|Customer|Support|Data/i.test(signal.impactCategory || signal.impact);
    const lowEffort = signal.effortEstimate === "Small";
    if (highImpact && lowEffort) return "Do now";
    if (highImpact) return "Plan";
    if (lowEffort) return "Quick win";
    return "Defer";
  }

  function getReadinessScore(analysis) {
    const signals = analysis?.signals || [];
    if (!signals.length) return 0;
    const progress = reviewProgress(signals);
    const lowConfidence = signals.filter((signal) => Number(signal.signalConfidence || 0) < 65).length;
    const ownerCounts = signals.reduce((map, signal) => {
      map[signal.owner] = (map[signal.owner] || 0) + 1;
      return map;
    }, {});
    const topOwnerCount = Math.max(0, ...Object.values(ownerCounts));
    const bottleneckPenalty = topOwnerCount / signals.length >= 0.5 ? 10 : topOwnerCount / signals.length >= 0.3 ? 5 : 0;
    const lowConfidencePenalty = Math.round((lowConfidence / signals.length) * 22);
    const reviewBonus = Math.round(progress.pct * 0.18);
    return clamp(Math.round((analysis.confidence || 70) + reviewBonus - lowConfidencePenalty - bottleneckPenalty), 1, 99);
  }

  function ensureAuditTrail(signal) {
    return Array.isArray(signal.auditTrail) ? signal.auditTrail : [];
  }

  function enrichSignal(signal) {
    const workflow = getRecommendedWorkflow(signal);
    const enriched = {
      ...signal,
      aiSuggestedPriority: signal.aiSuggestedPriority || signal.priority,
      aiSuggestedOwner: signal.aiSuggestedOwner || signal.owner,
      aiSuggestedImpact: signal.aiSuggestedImpact || signal.impact,
      aiSuggestedStatus: signal.aiSuggestedStatus || signal.status,
      overrideNote: String(signal.overrideNote || ""),
      auditTrail: ensureAuditTrail(signal),
      recommendedWorkflow: signal.recommendedWorkflow || workflow.state,
      workflowReason: signal.workflowReason || workflow.reason,
      impactCategory: String(signal.impactCategory || inferImpactCategory(signal)),
      effortEstimate: String(signal.effortEstimate || inferEffort(signal)),
      sourceStrength: String(signal.sourceStrength || inferSourceStrength(signal))
    };
    enriched.riskScore = getRiskScore(enriched);
    enriched.riskTone = getRiskTone(enriched.riskScore);
    enriched.confidenceReasons = Array.isArray(signal.confidenceReasons) && signal.confidenceReasons.length ? signal.confidenceReasons.map(String).filter(Boolean) : makeConfidenceReasons(enriched);
    enriched.escalationReason = String(signal.escalationReason || makeEscalationReason(enriched));
    enriched.priorityMatrixBucket = String(signal.priorityMatrixBucket || getMatrixBucket(enriched));
    enriched.humanEdited = Boolean(enriched.humanEdited) ||
      enriched.priority !== enriched.aiSuggestedPriority ||
      enriched.owner !== enriched.aiSuggestedOwner ||
      enriched.impact !== enriched.aiSuggestedImpact ||
      enriched.status !== enriched.aiSuggestedStatus ||
      Boolean(enriched.overrideNote);
    enriched.reviewState = enriched.reviewed ? "Reviewed" : enriched.humanEdited ? "Edited" : enriched.signalConfidence < 65 ? "Needs verification" : "AI draft";
    return enriched;
  }

  function reviewProgress(signals = []) {
    const reviewed = signals.filter((signal) => signal.reviewed || ["Accepted", "Assigned", "Resolved"].includes(signal.status) || Boolean(signal.overrideNote)).length;
    return { reviewed, total: signals.length, pct: signals.length ? Math.round((reviewed / signals.length) * 100) : 0 };
  }

  function countTerms(text, terms) {
    const lower = text.toLowerCase();
    return terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
  }

  function splitSignals(raw) {
    const cleaned = raw.replace(/\r/g, "").trim();
    if (!cleaned) return [];
    const lines = cleaned.split(/\n+/).map((item) => item.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
    return cleaned
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((item) => item.trim())
      .filter((item) => item.length > 20);
  }

  function most(values) {
    const counts = {};
    values.filter(Boolean).forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  function makeStats(signals) {
    const clusterIds = new Set(signals.map((signal) => signal.clusterId).filter(Boolean));
    const duplicateGroups = new Set(signals.filter((signal) => signal.duplicateGroupId).map((signal) => signal.duplicateGroupId));
    return {
      highCount: signals.filter((signal) => signal.priority === "High").length,
      mediumCount: signals.filter((signal) => signal.priority === "Medium").length,
      designCount: signals.filter((signal) => signal.owner === "Design" || signal.status === "UX Review").length,
      engineeringCount: signals.filter((signal) => signal.owner === "Engineering" || signal.owner === "Data Platform").length,
      customerCount: signals.filter((signal) => /customer|revenue|experience|support|accessibility/i.test(signal.impact)).length,
      lowConfidenceCount: signals.filter((signal) => Number(signal.signalConfidence || 0) < 65).length,
      clusterCount: clusterIds.size,
      duplicateGroupCount: duplicateGroups.size
    };
  }

  function clusterSlug(value) {
    return String(value || "general")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "general";
  }

  function inferCluster(signal) {
    const haystack = [signal.text, signal.impact, signal.owner, signal.status].join(" ").toLowerCase();
    const matched = clusterRules.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
    if (matched) return matched;

    const impact = signal.impact || "General Triage";
    const owner = signal.owner || "Product";
    const title = `${impact} / ${owner}`;
    return {
      id: `cluster-${clusterSlug(title)}`,
      title,
      keywords: [],
      reason: "No obvious duplicate keyword pattern was detected, so this signal is grouped by inferred impact and owner."
    };
  }

  function applyClusters(signals, providedClusters = []) {
    const providedMap = new Map((providedClusters || []).map((cluster) => [String(cluster.id || cluster.clusterId || cluster.title), cluster]));
    const nextSignals = signals.map((signal) => {
      const provided = signal.clusterId ? providedMap.get(String(signal.clusterId)) : null;
      const inferred = provided || inferCluster(signal);
      const clusterId = String(signal.clusterId || inferred.id || `cluster-${clusterSlug(inferred.title)}`);
      const clusterTitle = String(signal.clusterTitle || inferred.title || "General Triage");
      return {
        ...signal,
        clusterId,
        clusterTitle,
        clusterReason: String(signal.clusterReason || inferred.reason || "Related signals grouped for human review."),
        duplicateGroupId: String(signal.duplicateGroupId || "")
      };
    });

    const grouped = new Map();
    nextSignals.forEach((signal) => {
      const existing = grouped.get(signal.clusterId) || {
        id: signal.clusterId,
        title: signal.clusterTitle,
        reason: signal.clusterReason,
        signalIds: [],
        highCount: 0,
        averageConfidence: 0,
        primaryOwner: signal.owner,
        primaryImpact: signal.impact,
        duplicateGroupId: ""
      };
      existing.signalIds.push(signal.id);
      if (signal.priority === "High") existing.highCount += 1;
      grouped.set(signal.clusterId, existing);
    });

    const clusters = [...grouped.values()].map((cluster) => {
      const clusterSignals = nextSignals.filter((signal) => signal.clusterId === cluster.id);
      const duplicateGroupId = clusterSignals.length > 1 ? `dup-${clusterSlug(cluster.title)}` : "";
      const averageConfidence = clusterSignals.length
        ? Math.round(clusterSignals.reduce((sum, signal) => sum + Number(signal.signalConfidence || 0), 0) / clusterSignals.length)
        : 0;
      const priority = cluster.highCount > 0 ? "High" : clusterSignals.some((signal) => signal.priority === "Medium") ? "Medium" : "Low";
      return {
        ...cluster,
        duplicateGroupId,
        signalCount: clusterSignals.length,
        averageConfidence,
        priority,
        primaryOwner: most(clusterSignals.map((signal) => signal.owner)) || cluster.primaryOwner,
        primaryImpact: most(clusterSignals.map((signal) => signal.impact)) || cluster.primaryImpact
      };
    }).sort((a, b) => b.signalCount - a.signalCount || priorityScore(b.priority) - priorityScore(a.priority));

    const clusterMap = new Map(clusters.map((cluster) => [cluster.id, cluster]));
    nextSignals.forEach((signal) => {
      const cluster = clusterMap.get(signal.clusterId);
      signal.clusterSize = cluster?.signalCount || 1;
      signal.duplicateGroupId = cluster?.duplicateGroupId || "";
    });

    return { signals: nextSignals, clusters };
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function showGeneratedArtifact(filename, type = "document") {
    if (!el.generatedArtifactPanel || !el.generatedArtifactMessage) return;
    el.generatedArtifactPanel.hidden = false;
    el.generatedArtifactMessage.textContent = `${filename} was created as a downloadable ${type}. The same content was also copied when browser permissions allowed it.`;
  }

  function downloadTextFile(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showGeneratedArtifact(filename, type.includes("markdown") ? "Markdown document" : type.includes("csv") ? "CSV file" : type.includes("json") ? "JSON file" : type.includes("rfc822") ? "email draft" : "text document");
  }

  function getExtension(filename) {
    const lower = String(filename || "").toLowerCase();
    return supportedFileExtensions.find((ext) => lower.endsWith(ext)) || "";
  }

  function isSupportedFile(file) {
    return Boolean(getExtension(file.name));
  }

  function isBrowserReadable(file) {
    return browserReadableExtensions.includes(getExtension(file.name));
  }

  function formatFileBytes(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
      reader.readAsText(file);
    });
  }

  function addSource(source) {
    const dedupeKey = `${source.type}:${source.url || source.name || source.label}`.toLowerCase();
    const duplicate = state.sources.some((existing) => existing.dedupeKey === dedupeKey);
    if (duplicate) {
      toast("That source is already attached.");
      return;
    }

    state.sources.push({
      id: slugId("source"),
      dedupeKey,
      createdAt: new Date().toISOString(),
      ...source
    });
    renderSources();
  }

  function renderSources() {
    if (!el.sourceTray) return;
    if (!state.sources.length) {
      el.sourceTray.innerHTML = `<span class="source-empty">No source URLs or files attached yet.</span>`;
      updateIntakeStatus();
      return;
    }

    el.sourceTray.innerHTML = state.sources.map((source) => {
      const typeLabel = source.type === "url" ? "URL" : source.extractable ? "Text" : "File";
      return `<span class="source-chip" data-source-id="${esc(source.id)}">
        <strong>${esc(typeLabel)}</strong>
        <span>${esc(source.label)}</span>
        <button class="source-remove" type="button" aria-label="Remove ${esc(source.label)}" data-remove-source="${esc(source.id)}">×</button>
      </span>`;
    }).join("");
    updateIntakeStatus();
  }

  function addUrlSource() {
    const raw = el.sourceUrlInput?.value.trim() || "";
    if (!raw) {
      toast("Paste a URL first.");
      return;
    }

    if (!isCompleteUrl(raw)) {
      updateInputReadiness();
      toast("Use a complete URL or domain before adding it.");
      return;
    }

    let parsed;
    try {
      parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    } catch {
      toast("That URL does not look valid yet.");
      return;
    }

    const label = trunc(`${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`, 60);
    addSource({
      type: "url",
      label,
      url: parsed.href,
      content: `Source URL provided for triage review: ${parsed.href}`
    });

    if (el.sourceUrlInput) el.sourceUrlInput.value = "";
    updateInputReadiness();
    toast("URL source attached.");
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    let accepted = 0;
    const rejected = [];

    for (const file of files) {
      if (!isSupportedFile(file)) {
        rejected.push(file.name);
        continue;
      }

      const sizeLabel = formatFileBytes(file.size);
      const extension = getExtension(file.name);

      if (isBrowserReadable(file) && file.size <= MAX_TEXT_FILE_BYTES) {
        try {
          let text = await readFileAsText(file);
          let note = `${extension.toUpperCase().replace(".", "")} · ${sizeLabel} · text included`;
          if (text.length > MAX_SOURCE_CHARS) {
            text = `${text.slice(0, MAX_SOURCE_CHARS)}\n\n[Source truncated after ${MAX_SOURCE_CHARS.toLocaleString()} characters for browser review.]`;
            note = `${extension.toUpperCase().replace(".", "")} · ${sizeLabel} · truncated text included`;
          }
          addSource({
            type: "file",
            label: file.name,
            name: file.name,
            mimeType: file.type || "text/plain",
            size: file.size,
            content: text,
            extractable: true,
            note
          });
          accepted += 1;
        } catch (error) {
          console.warn(error);
          addSource({
            type: "file",
            label: file.name,
            name: file.name,
            mimeType: file.type || "document",
            size: file.size,
            content: `Uploaded file could not be read in-browser: ${file.name} (${sizeLabel}).`,
            extractable: false,
            note: `${extension.toUpperCase().replace(".", "")} · read failed`
          });
          accepted += 1;
        }
      } else {
        const readableReason = isBrowserReadable(file) ? "file is too large for browser-side extraction" : "server parser required";
        addSource({
          type: "file",
          label: file.name,
          name: file.name,
          mimeType: file.type || "document",
          size: file.size,
          content: `Uploaded file source: ${file.name} (${file.type || "document"}, ${sizeLabel}). Content extraction not available in this browser build; ${readableReason}. Treat this as source metadata and ask a human to verify the file contents if needed.`,
          extractable: false,
          note: `${extension.toUpperCase().replace(".", "")} · ${sizeLabel} · metadata only`
        });
        accepted += 1;
      }
    }

    if (accepted && el.fileDropStatus) {
      el.fileDropStatus.textContent = `${accepted} source file${accepted === 1 ? "" : "s"} attached to this triage run.`;
      el.fileDropStatus.classList.add("has-files");
    }

    if (accepted) toast(`${accepted} file${accepted === 1 ? "" : "s"} attached.`);
    if (rejected.length) toast(`Unsupported file type: ${rejected.slice(0, 2).join(", ")}${rejected.length > 2 ? "…" : ""}`);
  }

  function composeInputPayload() {
    const parts = [];
    const pasted = el.input?.value.trim() || "";
    const draftUrl = el.sourceUrlInput?.value.trim() || "";

    state.sources.forEach((source, index) => {
      if (source.type === "url") {
        parts.push(`[Source ${index + 1}: URL]\n${source.content || source.url}`);
        return;
      }

      const sourceHeader = `[Source ${index + 1}: Uploaded File: ${source.name || source.label}]`;
      const meta = `Type: ${source.mimeType || "document"}; Size: ${formatFileBytes(source.size)}; Extraction: ${source.extractable ? "browser text included" : "metadata only"}`;
      parts.push(`${sourceHeader}\n${meta}\n${source.content || "No extracted content available."}`);
    });

    if (draftUrl && isCompleteUrl(draftUrl)) {
      const parsed = new URL(draftUrl.startsWith("http") ? draftUrl : `https://${draftUrl}`);
      parts.push(`[Source ${parts.length + 1}: URL Draft]\nSource URL provided for triage review: ${parsed.href}`);
    }

    if (pasted) parts.push(`[Source ${parts.length + 1}: Pasted Notes]\n${pasted}`);

    return parts.join("\n\n---\n\n").trim();
  }

  function sourceMetadata() {
    const metadata = state.sources.map((source) => ({
      type: source.type,
      label: source.label,
      url: source.url || null,
      name: source.name || null,
      mimeType: source.mimeType || null,
      size: source.size || null,
      extractable: Boolean(source.extractable)
    }));
    const draftUrl = el.sourceUrlInput?.value.trim() || "";
    if (draftUrl && isCompleteUrl(draftUrl)) {
      const parsed = new URL(draftUrl.startsWith("http") ? draftUrl : `https://${draftUrl}`);
      metadata.push({ type: "url", label: trunc(`${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`, 60), url: parsed.href, name: null, mimeType: null, size: null, extractable: false });
    }
    return metadata;
  }

  async function readCleanError(res, endpoint) {
    let text = "";
    try { text = await res.text(); } catch { text = ""; }
    const looksHtml = /^\s*<!doctype html|^\s*<html/i.test(text);
    if (looksHtml) return `${endpoint}: ${res.status} endpoint not found or returned an HTML error page. Confirm api/analyze.php exists in this deployed folder.`;
    return `${endpoint}: ${res.status} ${trunc(text || res.statusText || "request failed", 220)}`;
  }

  async function fetchAi(raw) {
    let lastError;
    for (const endpoint of API_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signals: raw, sources: sourceMetadata(), appVersion: APP_VERSION })
        });
        if (!res.ok) throw new Error(await readCleanError(res, endpoint));
        const data = await res.json();
        if (!Array.isArray(data.signals)) throw new Error(`${endpoint}: invalid response shape`);
        return hydrate({ ...data, mode: "api", endpoint });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("No API endpoint responded.");
  }

  function localAnalyze(raw) {
    const signals = splitSignals(raw).map((text, index) => {
      const high = countTerms(text, localTerms.high);
      const design = countTerms(text, localTerms.design);
      const engineering = countTerms(text, localTerms.engineering);
      const customer = countTerms(text, localTerms.customer) > 0;
      const priority = high >= 1 ? "High" : text.length > 130 ? "Medium" : "Low";
      const owner = engineering > design ? "Engineering" : design > 0 ? "Design" : customer ? "Support" : "Product";
      const impact = customer ? "Customer Experience" : priority === "High" ? "Operations" : design > engineering ? "Workflow Efficiency" : "Engineering Quality";
      const signalConfidence = clamp(62 + high * 8 + Math.max(design, engineering) * 5 + (customer ? 8 : 0), 45, 92);

      return {
        id: index + 1,
        text,
        priority,
        priorityScore: priorityScore(priority),
        priorityReason: "Local fallback detected urgency, risk, customer, and blocker language.",
        owner,
        ownerReason: "Local fallback routed this based on design, engineering, support, and operations keywords.",
        impact,
        impactReason: "Local fallback inferred impact from customer, workflow, data, accessibility, and operations language.",
        status: priority === "High" ? "Escalate" : owner === "Design" ? "UX Review" : "Needs Review",
        source: inferSourceLabel(text),
        signalConfidence,
        evidence: ["Keyword-based local analysis", priority === "High" ? "Urgency or risk terms detected" : "No critical terms detected"],
        openQuestions: priority === "High" ? ["Confirm scope and affected users before assignment."] : ["Validate priority with the owning team."]
      };
    });

    const stats = makeStats(signals);
    const topPriority = stats.highCount > 1 ? "High" : signals.some((signal) => signal.priority === "Medium") ? "Medium" : "Low";

    return hydrate({
      mode: "fallback",
      signalCount: signals.length,
      signals,
      overallPriority: topPriority,
      primaryOwner: most(signals.map((signal) => signal.owner)) || "Product",
      primaryImpact: most(signals.map((signal) => signal.impact)) || "Customer Experience",
      confidence: signals.length ? Math.round(signals.reduce((sum, signal) => sum + signal.signalConfidence, 0) / signals.length) : 70,
      stats,
      summary: `${signals.length} signals analyzed in local fallback mode. v1.8 supports the three-step workflow plus source URLs, attached files, editable review rows, clustering, duplicate groups, risk scores, action plans, review progress, review board mode, confidence reasons, source strength, priority matrix, readiness scoring, handoff packaging, chart filters, saved sessions, diagnostics, multi-format export, and drawer-based portfolio framing even when the live AI route is unavailable.`,
      nextStep: "Review high-priority rows, adjust ownership/status where needed, then export the structured triage JSON for follow-up.",
      why: "The server-side AI route was unavailable, so the UI used local fallback logic. Connect OPENAI_API_KEY on the server for live AI triage.",
      sources: sourceMetadata()
    });
  }

  function inferSourceLabel(text) {
    const sourceMatch = String(text).match(/^\[Source\s+\d+:[^\]]+\]/i);
    if (sourceMatch) return sourceMatch[0].replace(/[\[\]]/g, "");
    return "Pasted Input";
  }

  function hydrate(analysis) {
    const rawSignals = (analysis.signals || []).map((signal, index) => {
      const priority = normPriority(signal.priority);
      return {
        id: Number(signal.id || index + 1),
        text: String(signal.text || ""),
        priority,
        priorityScore: Number(signal.priorityScore || priorityScore(priority)),
        priorityReason: String(signal.priorityReason || "AI priority reasoning unavailable."),
        owner: String(signal.owner || "Product"),
        ownerReason: String(signal.ownerReason || "AI owner reasoning unavailable."),
        impact: String(signal.impact || "Customer Experience"),
        impactReason: String(signal.impactReason || "AI impact reasoning unavailable."),
        status: String(signal.status || "Needs Review"),
        source: String(signal.source || inferSourceLabel(signal.text) || "Pasted Input"),
        signalConfidence: clamp(signal.signalConfidence || signal.confidence || analysis.confidence || 78, 1, 99),
        evidence: Array.isArray(signal.evidence) ? signal.evidence.map(String).filter(Boolean) : [],
        openQuestions: Array.isArray(signal.openQuestions) ? signal.openQuestions.map(String).filter(Boolean) : [],
        clusterId: signal.clusterId ? String(signal.clusterId) : "",
        clusterTitle: signal.clusterTitle ? String(signal.clusterTitle) : "",
        clusterReason: signal.clusterReason ? String(signal.clusterReason) : "",
        duplicateGroupId: signal.duplicateGroupId ? String(signal.duplicateGroupId) : "",
        aiSuggestedPriority: signal.aiSuggestedPriority ? normPriority(signal.aiSuggestedPriority) : priority,
        aiSuggestedOwner: signal.aiSuggestedOwner ? String(signal.aiSuggestedOwner) : String(signal.owner || "Product"),
        aiSuggestedImpact: signal.aiSuggestedImpact ? String(signal.aiSuggestedImpact) : String(signal.impact || "Customer Experience"),
        aiSuggestedStatus: signal.aiSuggestedStatus ? String(signal.aiSuggestedStatus) : String(signal.status || "Needs Review"),
        recommendedWorkflow: signal.recommendedWorkflow ? String(signal.recommendedWorkflow) : "",
        workflowReason: signal.workflowReason ? String(signal.workflowReason) : "",
        riskScore: signal.riskScore ? Number(signal.riskScore) : 0,
        overrideNote: signal.overrideNote ? String(signal.overrideNote) : "",
        auditTrail: Array.isArray(signal.auditTrail) ? signal.auditTrail : [],
        impactCategory: signal.impactCategory ? String(signal.impactCategory) : "",
        effortEstimate: signal.effortEstimate ? String(signal.effortEstimate) : "",
        sourceStrength: signal.sourceStrength ? String(signal.sourceStrength) : "",
        confidenceReasons: Array.isArray(signal.confidenceReasons) ? signal.confidenceReasons.map(String).filter(Boolean) : [],
        escalationReason: signal.escalationReason ? String(signal.escalationReason) : "",
        priorityMatrixBucket: signal.priorityMatrixBucket ? String(signal.priorityMatrixBucket) : "",
        reviewed: Boolean(signal.reviewed)
      };
    });

    const clustered = applyClusters(rawSignals, analysis.clusters || []);
    const signals = clustered.signals.map(enrichSignal);
    const stats = makeStats(signals);
    const confidence = signals.length
      ? Math.round(signals.reduce((sum, signal) => sum + signal.signalConfidence, 0) / signals.length)
      : clamp(analysis.confidence || 78, 1, 99);

    return {
      createdAt: analysis.createdAt || new Date().toISOString(),
      mode: analysis.mode || "api",
      endpoint: analysis.endpoint || "server",
      model: analysis.model || "",
      version: APP_VERSION,
      sources: analysis.sources || sourceMetadata(),
      diagnostics: {
        mode: analysis.mode || "api",
        endpoint: analysis.endpoint || analysis.diagnostics?.endpoint || "server",
        model: analysis.model || analysis.diagnostics?.model || "",
        error: analysis.error || analysis.diagnostics?.error || "",
        generatedAt: analysis.createdAt || new Date().toISOString()
      },
      signalCount: Number(analysis.signalCount || signals.length),
      signals,
      clusters: clustered.clusters,
      overallPriority: normPriority(analysis.overallPriority || most(signals.map((signal) => signal.priority)) || "Medium"),
      primaryOwner: String(analysis.primaryOwner || most(signals.map((signal) => signal.owner)) || "Product"),
      primaryImpact: String(analysis.primaryImpact || most(signals.map((signal) => signal.impact)) || "Customer Experience"),
      confidence: clamp(analysis.confidence || confidence, 1, 99),
      stats,
      summary: String(analysis.summary || "AI summary unavailable."),
      nextStep: String(analysis.nextStep || "Review the prioritized signals and assign follow-up owners."),
      why: String(analysis.why || "AI reasoning unavailable.")
    };
  }

  function recalculateAnalysis() {
    if (!state.analysis) return;
    const clustered = applyClusters(state.analysis.signals, state.analysis.clusters || []);
    state.analysis.signals = clustered.signals.map(enrichSignal);
    state.analysis.clusters = clustered.clusters;
    const signals = state.analysis.signals;
    const stats = makeStats(signals);
    state.analysis.signalCount = signals.length;
    state.analysis.stats = stats;
    state.analysis.primaryOwner = most(signals.map((signal) => signal.owner)) || "Product";
    state.analysis.primaryImpact = most(signals.map((signal) => signal.impact)) || "Customer Experience";
    state.analysis.confidence = signals.length ? Math.round(signals.reduce((sum, signal) => sum + signal.signalConfidence, 0) / signals.length) : state.analysis.confidence;
    state.analysis.overallPriority = stats.highCount > 0 ? "High" : signals.some((signal) => signal.priority === "Medium") ? "Medium" : "Low";
    state.analysis.version = APP_VERSION;
  }

  function render(analysis) {
    setResultsVisible(true);
    state.analysis = analysis;
    state.reviewed = false;
    state.expanded.clear();
    setStatus(analysis.mode === "api" ? "" : "fallback", analysis.mode === "api" ? `Live AI connected · ${analysis.model || analysis.endpoint}` : "Demo mode · API route not connected");
    if (el.reviewBadge) el.reviewBadge.textContent = analysis.mode === "api" ? "AI Generated" : "Demo Analysis";
    if (el.reviewed) el.reviewed.disabled = false;
    if (el.export) el.export.disabled = false;
    if (el.exportCsv) el.exportCsv.disabled = false;
    if (el.exportMarkdown) el.exportMarkdown.disabled = false;
    if (el.exportAuditReport) el.exportAuditReport.disabled = false;
    if (el.saveSession) el.saveSession.disabled = false;
    if (el.copySummary) el.copySummary.disabled = false;
    if (el.copySlack) el.copySlack.disabled = false;
    if (el.copyEmailBrief) el.copyEmailBrief.disabled = false;
    if (el.copyTopJira) el.copyTopJira.disabled = false;
    if (el.copyReviewedActions) el.copyReviewedActions.disabled = false;
    if (el.copyHandoff) el.copyHandoff.disabled = false;
    if (el.continueToActions) el.continueToActions.disabled = false;
    if (el.continueToActionsBottom) el.continueToActionsBottom.disabled = false;
    updateSaveSignalState();
    updateEmailValidationState();
    setDiagnostics(analysis);
    updateSummary();
    renderFilterOptions();
    renderClusters();
    renderTable();
    setViewMode("table");
    updateActionTemplates();
    saveAnalysis();
    renderSessionOptions();
    showStep(2);
  }

  function setDiagnostics(analysis) {
    const diagnostics = analysis?.diagnostics || {};
    if (!analysis) {
      if (el.diagnosticMode) el.diagnosticMode.textContent = "Not run";
      if (el.diagnosticRoute) el.diagnosticRoute.textContent = "—";
      if (el.diagnosticModel) el.diagnosticModel.textContent = "—";
      if (el.diagnosticTimestamp) el.diagnosticTimestamp.textContent = "—";
      if (el.diagnosticMessage) el.diagnosticMessage.textContent = "Run triage to see whether the live AI route or local fallback generated the result.";
      return;
    }
    const mode = analysis.mode === "api" ? "Live AI" : analysis.mode === "fallback" ? "Local fallback" : "Not run";
    if (el.diagnosticMode) el.diagnosticMode.textContent = mode;
    if (el.diagnosticRoute) el.diagnosticRoute.textContent = analysis.endpoint || diagnostics.endpoint || (analysis.mode === "fallback" ? "Browser fallback" : "—");
    if (el.diagnosticModel) el.diagnosticModel.textContent = analysis.model || diagnostics.model || (analysis.mode === "fallback" ? "Local rules" : "—");
    if (el.diagnosticTimestamp) {
      const stamp = diagnostics.generatedAt || analysis.createdAt;
      el.diagnosticTimestamp.textContent = stamp ? new Date(stamp).toLocaleString() : "—";
    }
    if (el.diagnosticMessage) {
      if (analysis.mode === "api") {
        el.diagnosticMessage.textContent = "Live server route generated this run. Keep API keys server-side and verify outputs before assignment.";
      } else if (diagnostics.error) {
        el.diagnosticMessage.textContent = `Live route unavailable; local fallback generated this run. Last route error: ${diagnostics.error}`;
      } else {
        el.diagnosticMessage.textContent = "Local fallback generated this run. Connect the server route and OPENAI_API_KEY for live AI triage.";
      }
    }
  }

  function chartRow(label, value, total, tone, options = {}) {
    const count = Number(value || 0);
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const attrs = options.filterType ? ` data-chart-filter="${esc(options.filterType)}" data-chart-value="${esc(options.filterValue || label)}"` : "";
    const hint = options.hint ? `<small>${esc(options.hint)}</small>` : "";
    return `<button class="chart-row chart-${tone}" type="button"${attrs} aria-label="Filter by ${esc(label)}">
      <div class="chart-row-meta"><span>${esc(label)}</span><strong>${count} · ${pct}%</strong></div>
      <div class="chart-track" aria-hidden="true"><span style="width:${pct}%"></span></div>
      ${hint}
    </button>`;
  }

  function ownerTone(count, total) {
    const share = total > 0 ? count / total : 0;
    if (share >= 0.5) return "danger";
    if (share >= 0.3) return "warning";
    return "success";
  }

  function renderSignalCharts() {
    const analysis = state.analysis;
    const signals = analysis?.signals || [];
    const total = signals.length;
    const empty = `<p class="chart-empty">Run triage to visualize this breakdown.</p>`;

    if (!total) {
      if (el.priorityChart) el.priorityChart.innerHTML = empty;
      if (el.ownerChart) el.ownerChart.innerHTML = empty;
      if (el.confidenceChart) el.confidenceChart.innerHTML = empty;
      if (el.priorityChartReadout) el.priorityChartReadout.textContent = "Priority mix will show risk load after triage.";
      if (el.ownerChartReadout) el.ownerChartReadout.textContent = "Owner routing will show workload concentration after triage.";
      if (el.confidenceChartReadout) el.confidenceChartReadout.textContent = "Confidence spread will show review readiness after triage.";
      return;
    }

    const priorityCounts = {
      High: signals.filter((signal) => signal.priority === "High").length,
      Medium: signals.filter((signal) => signal.priority === "Medium").length,
      Low: signals.filter((signal) => signal.priority === "Low").length
    };

    if (el.priorityChart) {
      el.priorityChart.innerHTML = [
        chartRow("High", priorityCounts.High, total, "danger", { filterType: "priority", filterValue: "High", hint: "Escalate / unblock" }),
        chartRow("Medium", priorityCounts.Medium, total, "warning", { filterType: "priority", filterValue: "Medium", hint: "Schedule / validate" }),
        chartRow("Low", priorityCounts.Low, total, "success", { filterType: "priority", filterValue: "Low", hint: "Monitor / backlog" })
      ].join("");
    }
    if (el.priorityChartReadout) {
      const topPriority = Object.entries(priorityCounts).sort((a, b) => b[1] - a[1])[0];
      el.priorityChartReadout.textContent = topPriority?.[1]
        ? `${topPriority[0]} priority is the largest group (${topPriority[1]} of ${total}), so review that bucket first.`
        : "No priority signals detected.";
    }

    const ownerCounts = signals.reduce((map, signal) => {
      const owner = signal.owner || "Product";
      map[owner] = (map[owner] || 0) + 1;
      return map;
    }, {});
    const ownerRows = Object.entries(ownerCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5);

    if (el.ownerChart) {
      el.ownerChart.innerHTML = ownerRows.map(([owner, count]) => {
        const tone = ownerTone(count, total);
        const hint = tone === "danger" ? "Bottleneck risk" : tone === "warning" ? "Watch concentration" : "Balanced";
        return chartRow(owner, count, total, tone, { filterType: "owner", filterValue: owner, hint });
      }).join("") || empty;
    }
    if (el.ownerChartReadout) {
      const topOwner = ownerRows[0];
      const topShare = topOwner ? Math.round((topOwner[1] / total) * 100) : 0;
      el.ownerChartReadout.textContent = topOwner
        ? `${topOwner[0]} owns ${topOwner[1]} of ${total} signals (${topShare}%). ${topShare >= 50 ? "That is a bottleneck risk." : topShare >= 30 ? "Watch for routing concentration." : "Ownership looks reasonably balanced."}`
        : "No owner routing detected.";
    }

    const confidenceCounts = {
      Low: signals.filter((signal) => Number(signal.signalConfidence || 0) < 60).length,
      Watch: signals.filter((signal) => Number(signal.signalConfidence || 0) >= 60 && Number(signal.signalConfidence || 0) < 80).length,
      High: signals.filter((signal) => Number(signal.signalConfidence || 0) >= 80).length
    };

    if (el.confidenceChart) {
      el.confidenceChart.innerHTML = [
        chartRow("Low", confidenceCounts.Low, total, "danger", { filterType: "confidence", filterValue: "Low", hint: "Verify before assignment" }),
        chartRow("Watch", confidenceCounts.Watch, total, "warning", { filterType: "confidence", filterValue: "Watch", hint: "Human review" }),
        chartRow("High", confidenceCounts.High, total, "success", { filterType: "confidence", filterValue: "High", hint: "Ready to act" })
      ].join("");
    }
    if (el.confidenceChartReadout) {
      el.confidenceChartReadout.textContent = `${confidenceCounts.High} high-confidence signal${confidenceCounts.High === 1 ? "" : "s"} can move faster; ${confidenceCounts.Low + confidenceCounts.Watch} need review or validation before assignment.`;
    }
  }


  function renderPriorityMatrix() {
    if (!el.priorityMatrix) return;
    const signals = state.analysis?.signals || [];
    if (!signals.length) {
      el.priorityMatrix.innerHTML = `<p class="chart-empty">Run triage to map signals by impact and effort.</p>`;
      return;
    }
    const buckets = ["Do now", "Plan", "Quick win", "Defer"];
    const bucketMeta = {
      "Do now": { label: "High impact / low effort", tone: "success", hint: "Act now" },
      "Plan": { label: "High impact / higher effort", tone: "warning", hint: "Plan and scope" },
      "Quick win": { label: "Lower impact / low effort", tone: "success", hint: "Fast improvement" },
      "Defer": { label: "Lower impact / higher effort", tone: "danger", hint: "Question value" }
    };
    el.priorityMatrix.innerHTML = buckets.map((bucket) => {
      const bucketSignals = signals.filter((signal) => signal.priorityMatrixBucket === bucket);
      const meta = bucketMeta[bucket];
      const preview = bucketSignals.slice(0, 2).map((signal) => `<li>${esc(trunc(signal.text, 82))}</li>`).join("");
      return `<button class="matrix-cell matrix-${meta.tone}" type="button" data-matrix-filter="${esc(bucket)}">
        <span>${esc(bucket)}</span>
        <strong>${bucketSignals.length}</strong>
        <small>${esc(meta.label)} · ${esc(meta.hint)}</small>
        ${preview ? `<ul>${preview}</ul>` : `<p>No signals in this quadrant.</p>`}
      </button>`;
    }).join("");
  }

  function makeBeforeAfterText(analysis) {
    const sources = state.sources?.length || analysis?.sources?.length || 0;
    const signals = analysis?.signals || [];
    const clusters = analysis?.clusters || [];
    const reviewed = reviewProgress(signals);
    const high = signals.filter((signal) => signal.priority === "High").length;
    const validation = signals.filter((signal) => signal.signalConfidence < 65).length;
    return `Before: ${sources || "pasted"} source${sources === 1 ? "" : "s"} with unstructured notes, tickets, files, or URLs. After: ${signals.length} actionable signal${signals.length === 1 ? "" : "s"}, ${clusters.length} cluster${clusters.length === 1 ? "" : "s"}, ${high} escalation candidate${high === 1 ? "" : "s"}, ${validation} validation item${validation === 1 ? "" : "s"}, and ${reviewed.reviewed} reviewed action${reviewed.reviewed === 1 ? "" : "s"}.`;
  }

  function updateV16Workspace() {
    const analysis = state.analysis;
    const signals = analysis?.signals || [];
    const readiness = getReadinessScore(analysis);
    if (el.readinessScore) el.readinessScore.textContent = signals.length ? `${readiness}%` : "—";
    if (el.beforeAfterText) el.beforeAfterText.textContent = makeBeforeAfterText(analysis);
    if (el.handoffReadinessText) {
      if (!signals.length) el.handoffReadinessText.textContent = "Run triage to see whether the output is ready for assignment, needs validation, or has bottleneck risk.";
      else if (readiness >= 80) el.handoffReadinessText.textContent = "High readiness: most signals have enough confidence and structure for handoff after a quick human pass.";
      else if (readiness >= 60) el.handoffReadinessText.textContent = "Medium readiness: review low-confidence items and owner concentration before assignment.";
      else el.handoffReadinessText.textContent = "Low readiness: validate evidence, owner routing, and escalation candidates before handoff.";
    }
  }

  function renderBoard() {
    if (!el.reviewBoard) return;
    const signals = getFilteredSignals();
    if (!state.analysis) {
      el.reviewBoard.innerHTML = `<p class="empty-state mb-0">Run triage to see signals grouped by recommended workflow state.</p>`;
      return;
    }
    const states = ["Escalate", "Validate", "Assign", "Schedule", "Monitor", "Backlog", "Resolved"];
    const columns = states.map((stateName) => {
      const items = signals.filter((signal) => (signal.recommendedWorkflow || signal.status || "Monitor") === stateName || (stateName === "Resolved" && ["Accepted", "Assigned", "Resolved"].includes(signal.status)));
      const cards = items.map((signal) => `<article class="board-card board-${esc(signal.riskTone)}">
        <div class="board-card-header"><strong>${esc(signal.priority)}</strong><span>Risk ${signal.riskScore}/99</span></div>
        <p>${esc(trunc(signal.text, 120))}</p>
        <div class="board-meta"><span>${esc(signal.owner)}</span><span>${esc(signal.impactCategory)}</span><span>${esc(signal.effortEstimate)}</span></div>
      </article>`).join("");
      return `<section class="board-column">
        <h3>${esc(stateName)} <span>${items.length}</span></h3>
        ${cards || `<p class="board-empty">No signals.</p>`}
      </section>`;
    }).join("");
    el.reviewBoard.innerHTML = `<div class="board-grid">${columns}</div>`;
  }

  function setViewMode(mode = "table") {
    state.viewMode = mode === "board" ? "board" : "table";
    const isBoard = state.viewMode === "board";
    if (el.tableViewWrap) el.tableViewWrap.hidden = isBoard;
    if (el.reviewBoard) el.reviewBoard.hidden = !isBoard;
    el.tableView?.classList.toggle("is-active", !isBoard);
    el.boardView?.classList.toggle("is-active", isBoard);
    el.tableView?.classList.toggle("btn-outline-light", !isBoard);
    el.tableView?.classList.toggle("btn-ghost", isBoard);
    el.boardView?.classList.toggle("btn-outline-light", isBoard);
    el.boardView?.classList.toggle("btn-ghost", !isBoard);
    if (isBoard) renderBoard();
  }

  function applyChartFilter(type, value) {
    if (!state.analysis) return;
    if (type === "priority") {
      state.filters.priority = value;
      if (el.priorityFilter) el.priorityFilter.value = value;
    } else if (type === "owner") {
      state.filters.owner = value;
      if (el.ownerFilter) el.ownerFilter.value = value;
    } else if (type === "confidence") {
      state.filters.confidence = value;
      state.filters.search = "";
      if (el.search) el.search.value = "";
      state.filters.sort = "confidenceDesc";
      if (el.sortSelect) el.sortSelect.value = "confidenceDesc";
    }
    renderTable();
    toast(`Filtered table by ${value}.`);
  }


  function makeDecisionReadout(analysis) {
    const signals = analysis?.signals || [];
    if (!signals.length) return "Run triage to get an executive readout of risk, owner concentration, confidence, and recommended next moves.";
    const high = signals.filter((signal) => signal.priority === "High").length;
    const lowConfidence = signals.filter((signal) => signal.signalConfidence < 65).length;
    const topOwner = most(signals.map((signal) => signal.owner)) || "Product";
    const ownerCount = signals.filter((signal) => signal.owner === topOwner).length;
    const ownerShare = Math.round((ownerCount / signals.length) * 100);
    const topRisk = [...signals].sort((a, b) => b.riskScore - a.riskScore)[0];
    return `${signals.length} signals across ${analysis.clusters?.length || 0} clusters. ${high} high-risk item${high === 1 ? "" : "s"}; top risk is ${topRisk?.riskScore || "—"}/99. ${topOwner} owns ${ownerShare}% of routed work${ownerShare >= 50 ? ", which may create a bottleneck" : ""}. ${lowConfidence} signal${lowConfidence === 1 ? "" : "s"} need confidence review before assignment.`;
  }

  function makeActionPlan(analysis) {
    const signals = [...(analysis?.signals || [])];
    if (!signals.length) return ["Run triage to generate recommended actions for escalation, validation, assignment, and follow-up."];
    const actions = [];
    const high = signals.filter((signal) => signal.priority === "High").sort((a, b) => b.riskScore - a.riskScore);
    const lowConfidence = signals.filter((signal) => signal.signalConfidence < 65).sort((a, b) => a.signalConfidence - b.signalConfidence);
    const duplicateClusters = (analysis.clusters || []).filter((cluster) => cluster.signalCount > 1);
    const ownerCounts = signals.reduce((map, signal) => {
      map[signal.owner] = (map[signal.owner] || 0) + 1;
      return map;
    }, {});
    const ownerBottleneck = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])[0];

    if (high[0]) actions.push(`Escalate highest-risk signal to ${high[0].owner}: ${trunc(high[0].text, 110)}`);
    if (duplicateClusters[0]) actions.push(`Review duplicate cluster “${duplicateClusters[0].title}” before creating separate tickets.`);
    if (lowConfidence[0]) actions.push(`Validate low-confidence signal (${lowConfidence[0].signalConfidence}%) before assignment: ${trunc(lowConfidence[0].text, 100)}`);
    if (ownerBottleneck && ownerBottleneck[1] / signals.length >= 0.5) actions.push(`Check ${ownerBottleneck[0]} capacity before assigning ${ownerBottleneck[1]} related signal${ownerBottleneck[1] === 1 ? "" : "s"}.`);
    actions.push("Create reviewed-actions docs or export the report after human edits are complete.");
    return actions.slice(0, 5);
  }

  function makeRecommendedNextMove(analysis) {
    const signals = analysis?.signals || [];
    if (!signals.length) return "Run triage to get a focused recommendation for what to review first and what should happen before handoff.";
    const high = signals.filter((signal) => signal.priority === "High").sort((a, b) => b.riskScore - a.riskScore);
    const lowConfidence = signals.filter((signal) => signal.signalConfidence < 65).sort((a, b) => a.signalConfidence - b.signalConfidence);
    const topOwner = most(signals.map((signal) => signal.owner)) || "Product";
    const ownerShare = Math.round((signals.filter((signal) => signal.owner === topOwner).length / signals.length) * 100);
    if (high.length) return `Review the ${high.length} high-risk signal${high.length === 1 ? "" : "s"} first, starting with ${high[0].owner}. Confirm impact and owner before creating the handoff package.`;
    if (lowConfidence.length) return `Validate ${lowConfidence.length} lower-confidence signal${lowConfidence.length === 1 ? "" : "s"} before assignment, then export the reviewed action list.`;
    if (ownerShare >= 50) return `Check ${topOwner} capacity before handoff. ${topOwner} owns ${ownerShare}% of this run, which may create a bottleneck.`;
    return "Review the table, confirm ownership, then use Step 3 to create the email, ticket, update, or handoff package.";
  }

  function updateDecisionWorkspace() {
    const analysis = state.analysis;
    const signals = analysis?.signals || [];
    if (el.decisionReadout) el.decisionReadout.textContent = makeDecisionReadout(analysis);
    if (el.recommendedNextMove) el.recommendedNextMove.innerHTML = `<span>Recommended next move</span><p>${esc(makeRecommendedNextMove(analysis))}</p>`;
    const progress = reviewProgress(signals);
    if (el.reviewProgressLabel) el.reviewProgressLabel.textContent = `${progress.reviewed} of ${progress.total} reviewed`;
    if (el.reviewProgressBar) el.reviewProgressBar.style.width = `${progress.pct}%`;
    const actions = makeActionPlan(analysis);
    if (el.actionPlanList) el.actionPlanList.innerHTML = actions.map((action) => `<li>${esc(action)}</li>`).join("");
    if (el.actionPlanBadge) el.actionPlanBadge.textContent = analysis ? `${actions.length} recommended action${actions.length === 1 ? "" : "s"}` : "Waiting for triage";
  }

  function applyAiReviewTones(analysis) {
    if (!analysis) return;
    setTone(el.priorityCard, priorityTone(analysis.overallPriority));
    setTone(el.confidenceCard, confidenceTone(analysis.confidence));
    setTone(el.impactCard, /Revenue|Compliance|Support Load|Accessibility/i.test(analysis.primaryImpact || "") ? "warning" : "success");
    setTone(el.ownerCard, ownerConcentrationTone(analysis));

    const metricCards = document.querySelectorAll(".ai-review-metrics > div");
    setTone(metricCards[0], Number(analysis.signalCount || 0) > 0 ? "success" : "neutral");
    setTone(metricCards[1], Number(analysis.stats?.highCount || 0) > 0 ? "danger" : "success");
    setTone(metricCards[2], confidenceTone(analysis.confidence));
    setTone(metricCards[3], Number(analysis.stats?.duplicateGroupCount || 0) > 0 ? "warning" : "success");

    const readiness = getReadinessScore(analysis);
    setTone(document.querySelector(".v16-readiness-card"), confidenceTone(readiness));
    setTone(document.querySelector(".review-progress-card"), state.reviewed ? "success" : "warning");
    setTone(document.querySelector(".action-plan-panel"), Number(analysis.stats?.highCount || 0) > 0 ? "danger" : "success");
  }

  function updateSummary() {
    if (!state.analysis) return;
    const analysis = state.analysis;
    if (el.signalCount) el.signalCount.textContent = analysis.signalCount;
    if (el.highCount) el.highCount.textContent = analysis.stats.highCount;
    if (el.confidence) el.confidence.textContent = `${analysis.confidence}%`;
    if (el.clusterCount) el.clusterCount.textContent = analysis.stats.clusterCount || analysis.clusters?.length || 0;
    if (el.statHigh) el.statHigh.textContent = analysis.stats.highCount;
    if (el.statDesign) el.statDesign.textContent = analysis.stats.designCount;
    if (el.statEngineering) el.statEngineering.textContent = analysis.stats.engineeringCount;
    if (el.statCustomer) el.statCustomer.textContent = analysis.stats.customerCount;
    const totalSignals = Math.max(Number(analysis.signalCount || analysis.signals?.length || 0), 1);
    const statPct = (value) => Math.round((Number(value || 0) / totalSignals) * 100);
    const statPairs = [
      [el.statHighMeta, el.statHighBar, analysis.stats.highCount, "need escalation or close review"],
      [el.statDesignMeta, el.statDesignBar, analysis.stats.designCount, "require UX/product validation"],
      [el.statEngineeringMeta, el.statEngineeringBar, analysis.stats.engineeringCount, "may create an engineering bottleneck"],
      [el.statCustomerMeta, el.statCustomerBar, analysis.stats.customerCount, "affect customer experience or trust"]
    ];
    statPairs.forEach(([meta, bar, value, copy]) => {
      const pct = statPct(value);
      if (meta) meta.textContent = `${pct}% ${copy}`;
    });
    if (el.priorityCard) {
      el.priorityCard.classList.remove("priority-high", "priority-medium", "priority-low");
      el.priorityCard.classList.add(`priority-${analysis.overallPriority.toLowerCase()}`);
    }
    applyAiReviewTones(analysis);
    if (el.overallPriority) el.overallPriority.textContent = analysis.overallPriority;
    if (el.priorityReason) el.priorityReason.textContent = `${analysis.stats.highCount} high-priority signal${analysis.stats.highCount === 1 ? "" : "s"} · ${analysis.stats.duplicateGroupCount || 0} duplicate group${(analysis.stats.duplicateGroupCount || 0) === 1 ? "" : "s"}.`;
    if (el.primaryImpact) el.primaryImpact.textContent = analysis.primaryImpact;
    if (el.primaryOwner) el.primaryOwner.textContent = analysis.primaryOwner;
    if (el.summaryConfidence) el.summaryConfidence.textContent = `${analysis.confidence}%`;
    if (el.summaryText) el.summaryText.textContent = analysis.summary;
    if (el.nextStep) el.nextStep.textContent = analysis.nextStep;
    if (el.whyText) el.whyText.textContent = analysis.why;
    updateDecisionWorkspace();
    updateV16Workspace();
    renderSignalCharts();
    renderPriorityMatrix();
    renderBoard();
  }


  function renderClusters() {
    if (!el.clusterList) return;
    const clusters = state.analysis?.clusters || [];
    if (!clusters.length) {
      el.clusterList.innerHTML = `<p class="empty-state mb-0">Run triage to group related signals and expose likely duplicate issue patterns.</p>`;
      if (el.clusterBadge) el.clusterBadge.textContent = "No clusters yet";
      return;
    }

    const duplicateCount = clusters.filter((cluster) => cluster.signalCount > 1).length;
    if (el.clusterBadge) el.clusterBadge.textContent = `${clusters.length} cluster${clusters.length === 1 ? "" : "s"} · ${duplicateCount} duplicate group${duplicateCount === 1 ? "" : "s"}`;

    el.clusterList.innerHTML = clusters.map((cluster) => {
      const signals = (state.analysis?.signals || []).filter((signal) => signal.clusterId === cluster.id);
      const topSignals = signals.slice(0, 3).map((signal) => `<li>${esc(trunc(signal.text, 120))}</li>`).join("");
      const duplicateLabel = cluster.signalCount > 1 ? `<span class="cluster-duplicate">Possible duplicate group</span>` : `<span class="cluster-single">Single signal</span>`;
      return `<article class="cluster-card">
        <div class="cluster-card-header">
          <div><h3>${esc(cluster.title)}</h3><p>${esc(cluster.reason || "Related signals grouped for review.")}</p></div>
          <strong>${cluster.signalCount}</strong>
        </div>
        <div class="cluster-meta">
          <span>${esc(cluster.priority)} priority</span>
          <span>${esc(cluster.primaryOwner || "Product")}</span>
          <span>${esc(cluster.primaryImpact || "Customer Experience")}</span>
          <span>${cluster.averageConfidence || 0}% avg confidence</span>
          ${duplicateLabel}
        </div>
        <ul class="cluster-signal-list">${topSignals}</ul>
      </article>`;
    }).join("");
  }

  function renderFilterOptions() {
    if (!state.analysis) return;
    const owners = [...new Set([...ownerOptions, ...state.analysis.signals.map((signal) => signal.owner)])].filter(Boolean).sort();
    const statuses = [...new Set([...statusOptions, ...state.analysis.signals.map((signal) => signal.status)])].filter(Boolean).sort();
    const clusters = [...new Set(state.analysis.signals.map((signal) => signal.clusterTitle).filter(Boolean))].sort();

    if (el.ownerFilter) {
      const current = state.filters.owner;
      el.ownerFilter.innerHTML = `<option value="all">All owners</option>${owners.map((owner) => `<option value="${esc(owner)}">${esc(owner)}</option>`).join("")}`;
      el.ownerFilter.value = owners.includes(current) ? current : "all";
      state.filters.owner = el.ownerFilter.value;
    }

    if (el.statusFilter) {
      const current = state.filters.status;
      el.statusFilter.innerHTML = `<option value="all">All statuses</option>${statuses.map((status) => `<option value="${esc(status)}">${esc(status)}</option>`).join("")}`;
      el.statusFilter.value = statuses.includes(current) ? current : "all";
      state.filters.status = el.statusFilter.value;
    }

    if (el.clusterFilter) {
      const current = state.filters.cluster;
      el.clusterFilter.innerHTML = `<option value="all">All clusters</option>${clusters.map((cluster) => `<option value="${esc(cluster)}">${esc(cluster)}</option>`).join("")}`;
      el.clusterFilter.value = clusters.includes(current) ? current : "all";
      state.filters.cluster = el.clusterFilter.value;
    }
  }

  function getFilteredSignals() {
    if (!state.analysis) return [];
    let signals = [...state.analysis.signals];
    const query = state.filters.search.trim().toLowerCase();

    if (query) {
      signals = signals.filter((signal) => [signal.text, signal.priorityReason, signal.ownerReason, signal.impactReason, signal.owner, signal.impact, signal.impactCategory, signal.effortEstimate, signal.sourceStrength, signal.recommendedWorkflow, signal.priorityMatrixBucket, signal.status, signal.source, signal.clusterTitle, signal.duplicateGroupId]
        .join(" ")
        .toLowerCase()
        .includes(query));
    }
    if (state.filters.priority !== "all") signals = signals.filter((signal) => signal.priority === state.filters.priority);
    if (state.filters.owner !== "all") signals = signals.filter((signal) => signal.owner === state.filters.owner);
    if (state.filters.status !== "all") signals = signals.filter((signal) => signal.status === state.filters.status);
    if (state.filters.cluster !== "all") signals = signals.filter((signal) => signal.clusterTitle === state.filters.cluster);
    if (state.filters.confidence && state.filters.confidence !== "all") {
      signals = signals.filter((signal) => {
        const confidence = Number(signal.signalConfidence || 0);
        if (state.filters.confidence === "Low") return confidence < 60;
        if (state.filters.confidence === "Watch") return confidence >= 60 && confidence < 80;
        if (state.filters.confidence === "High") return confidence >= 80;
        return true;
      });
    }

    if (state.filters.matrix && state.filters.matrix !== "all") {
      signals = signals.filter((signal) => signal.priorityMatrixBucket === state.filters.matrix);
    }

    const sort = state.filters.sort;
    signals.sort((a, b) => {
      if (sort === "priorityAsc") return a.priorityScore - b.priorityScore || b.signalConfidence - a.signalConfidence;
      if (sort === "confidenceDesc") return b.signalConfidence - a.signalConfidence || b.priorityScore - a.priorityScore;
      if (sort === "ownerAsc") return a.owner.localeCompare(b.owner) || b.priorityScore - a.priorityScore;
      if (sort === "statusAsc") return a.status.localeCompare(b.status) || b.priorityScore - a.priorityScore;
      if (sort === "sourceAsc") return a.source.localeCompare(b.source) || b.priorityScore - a.priorityScore;
      if (sort === "clusterAsc") return a.clusterTitle.localeCompare(b.clusterTitle) || b.priorityScore - a.priorityScore;
      return b.priorityScore - a.priorityScore || b.signalConfidence - a.signalConfidence;
    });

    return signals;
  }

  function renderTable() {
    if (!el.table) return;
    if (!state.analysis) {
      el.table.innerHTML = `<tr><td colspan="7" class="empty-state">No AI analysis yet. Paste signals or load the sample set.</td></tr>`;
      return;
    }

    const signals = getFilteredSignals();
    if (!signals.length) {
      el.table.innerHTML = `<tr><td colspan="7" class="empty-state">No matching signals. Try clearing filters or search.</td></tr>`;
      renderBoard();
      return;
    }

    el.table.innerHTML = signals.map((signal) => {
      const isExpanded = state.expanded.has(signal.id);
      const prioritySelect = `<select class="form-select form-select-sm signal-edit priority-edit" data-field="priority" data-id="${signal.id}">${priorityOptions.map((option) => `<option value="${option}"${signal.priority === option ? " selected" : ""}>${option}</option>`).join("")}</select>`;
      const ownerValues = [...new Set([...ownerOptions, signal.owner])].filter(Boolean).sort();
      const ownerSelect = `<select class="form-select form-select-sm signal-edit" data-field="owner" data-id="${signal.id}">${ownerValues.map((option) => `<option value="${esc(option)}"${signal.owner === option ? " selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
      const statusValues = [...new Set([...statusOptions, signal.status])].filter(Boolean);
      const statusSelect = `<select class="form-select form-select-sm signal-edit" data-field="status" data-id="${signal.id}">${statusValues.map((option) => `<option value="${esc(option)}"${signal.status === option ? " selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
      const impactInput = `<input class="form-control form-control-sm signal-edit" data-field="impact" data-id="${signal.id}" value="${esc(signal.impact)}" />`;
      const detailButton = `<button class="btn btn-ghost btn-sm detail-toggle" type="button" data-id="${signal.id}" aria-expanded="${isExpanded ? "true" : "false"}">${isExpanded ? "Hide" : "View"}</button>`;
      const clusterBadge = `<span class="cluster-mini ${signal.duplicateGroupId ? "is-duplicate" : ""}" title="${esc(signal.clusterReason)}">${esc(signal.clusterTitle)}${signal.clusterSize > 1 ? ` · ${signal.clusterSize}` : ""}</span>`;
      const confidenceBadge = signal.signalConfidence < 65 ? `<span class="low-confidence">Needs review</span>` : "";
      const editedBadge = signal.humanEdited ? `<span class="human-edited">Edited by human</span>` : "";
      const riskBadge = `<span class="risk-score risk-${esc(signal.riskTone)}">Risk ${signal.riskScore}/99</span>`;
      const workflowBadge = `<span class="workflow-state">${esc(signal.recommendedWorkflow)}</span>`;
      const impactCategoryBadge = `<span class="workflow-state">${esc(signal.impactCategory)}</span>`;
      const effortBadge = `<span class="workflow-state">Effort ${esc(signal.effortEstimate)}</span>`;
      const sourceStrengthBadge = `<span class="workflow-state">${esc(signal.sourceStrength)} source</span>`;
      const aiSuggestion = [
        signal.priority !== signal.aiSuggestedPriority ? `Priority: ${signal.aiSuggestedPriority}` : "",
        signal.owner !== signal.aiSuggestedOwner ? `Owner: ${signal.aiSuggestedOwner}` : "",
        signal.impact !== signal.aiSuggestedImpact ? `Impact: ${signal.aiSuggestedImpact}` : "",
        signal.status !== signal.aiSuggestedStatus ? `Status: ${signal.aiSuggestedStatus}` : ""
      ].filter(Boolean).join(" · ");
      const suggestionBlock = aiSuggestion ? `<p class="ai-suggestion">AI originally suggested ${esc(aiSuggestion)}.</p>` : `<p class="ai-suggestion">Current fields match the AI draft.</p>`;
      const overrideNote = `<textarea class="form-control form-control-sm override-note signal-edit" data-field="overrideNote" data-id="${signal.id}" rows="3" placeholder="Add a human override note or review rationale…">${esc(signal.overrideNote)}</textarea>`;
      const rowActions = `<div class="detail-actions"><button class="btn btn-ghost btn-sm" type="button" data-copy-ticket="${signal.id}">Create Jira Ticket Doc</button><button class="btn btn-ghost btn-sm" type="button" data-copy-signal-slack="${signal.id}">Create Team Update Doc</button></div>`;
      const evidence = signal.evidence.length ? `<ul>${signal.evidence.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p class="mini-note mb-0">No evidence bullets returned.</p>`;
      const openQuestions = signal.openQuestions.length ? `<ul>${signal.openQuestions.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p class="mini-note mb-0">No open questions returned.</p>`;
      const confidenceReasons = signal.confidenceReasons.length ? `<ul>${signal.confidenceReasons.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p class="mini-note mb-0">No confidence reasons available.</p>`;

      return `<tr data-signal-row="${signal.id}">
        <td class="signal-main-cell" data-label="Signal"><strong>${esc(trunc(signal.text, 180))}</strong><small>${esc(signal.source)} · ${signal.signalConfidence}% confidence ${confidenceBadge} ${editedBadge}</small><div class="signal-inline-meta">${riskBadge}${workflowBadge}${impactCategoryBadge}${effortBadge}${sourceStrengthBadge}</div></td>
        <td data-label="Priority">${prioritySelect}</td>
        <td data-label="Owner">${ownerSelect}</td>
        <td data-label="Impact">${impactInput}</td>
        <td data-label="Status">${statusSelect}</td>
        <td data-label="Cluster">${clusterBadge}</td>
        <td data-label="Details">${detailButton}</td>
      </tr>
      <tr class="signal-detail-row${isExpanded ? " is-open" : ""}" data-detail-row="${signal.id}">
        <td colspan="7" data-label="Details">
          <div class="signal-detail">
            <div class="detail-block detail-full"><h3>Full Signal</h3><p>${esc(signal.text)}</p></div>
            <div class="detail-grid">
              <div class="detail-block"><h3>Priority Reasoning</h3><p>${esc(signal.priorityReason)}</p></div>
              <div class="detail-block"><h3>Owner Reasoning</h3><p>${esc(signal.ownerReason)}</p></div>
              <div class="detail-block"><h3>Impact Reasoning</h3><p>${esc(signal.impactReason)}</p></div>
              <div class="detail-block"><h3>Source + Confidence</h3><p>${esc(signal.source)} · ${signal.signalConfidence}% confidence</p></div>
              <div class="detail-block"><h3>Risk + Recommended Workflow</h3><p><strong>${signal.riskScore}/99</strong> risk · ${esc(signal.recommendedWorkflow)}</p><p>${esc(signal.workflowReason)}</p></div>
              <div class="detail-block"><h3>Impact Category + Effort</h3><p>${esc(signal.impactCategory)} · ${esc(signal.effortEstimate)} effort</p><p>Matrix bucket: ${esc(signal.priorityMatrixBucket)}</p></div>
              <div class="detail-block"><h3>Confidence Reasons</h3>${confidenceReasons}</div>
              <div class="detail-block"><h3>Escalation + Source Strength</h3><p>${esc(signal.escalationReason)}</p><p>Source strength: ${esc(signal.sourceStrength)}</p></div>
              <div class="detail-block"><h3>AI vs Human</h3>${suggestionBlock}<p>Review state: ${esc(signal.reviewState)}</p>${overrideNote}${rowActions}</div>
              <div class="detail-block"><h3>Cluster / Duplicate Group</h3><p>${esc(signal.clusterTitle)}${signal.duplicateGroupId ? ` · ${esc(signal.duplicateGroupId)}` : ""}</p><p>${esc(signal.clusterReason)}</p></div>
              <div class="detail-block"><h3>Evidence</h3>${evidence}</div>
              <div class="detail-block"><h3>Open Questions</h3>${openQuestions}</div>
            </div>
          </div>
        </td>
      </tr>`;
    }).join("");
    renderBoard();
  }

  function updateSignal(signalId, field, value) {
    if (!state.analysis) return;
    const signal = state.analysis.signals.find((item) => item.id === Number(signalId));
    if (!signal) return;

    const before = signal[field];
    if (field === "priority") {
      signal.priority = normPriority(value);
      signal.priorityScore = priorityScore(signal.priority);
      signal.status = signal.priority === "High" && signal.status === "Needs Review" ? "Escalate" : signal.status;
    } else if (field === "owner") {
      signal.owner = String(value || "Product");
    } else if (field === "status") {
      signal.status = String(value || "Needs Review");
      if (["Accepted", "Assigned", "Resolved"].includes(signal.status)) signal.reviewed = true;
    } else if (field === "impact") {
      signal.impact = String(value || "Customer Experience");
      signal.impactCategory = inferImpactCategory(signal);
    } else if (field === "overrideNote") {
      signal.overrideNote = String(value || "");
      signal.reviewed = Boolean(signal.overrideNote) || signal.reviewed;
    }

    if (before !== signal[field]) {
      signal.auditTrail = ensureAuditTrail(signal);
      signal.auditTrail.push({ field, from: before ?? "", to: signal[field] ?? "", changedAt: new Date().toISOString() });
    }

    state.reviewed = false;
    if (el.reviewBadge) el.reviewBadge.textContent = "Edited";
    recalculateAnalysis();
    updateSummary();
    renderFilterOptions();
    renderClusters();
    renderTable();
    saveAnalysis();
  }


  const loadingStages = [
    "Preparing signal intake…",
    "Reading attached sources…",
    "Extracting UX signals…",
    "Scoring risk and confidence…",
    "Mapping owners and impact…",
    "Building action plan…",
    "Preparing review workspace…"
  ];

  function renderLoadingStages(activeIndex = 0) {
    if (el.processingStageList) {
      el.processingStageList.innerHTML = loadingStages.map((stage, index) => `<li class="${index < activeIndex ? "is-complete" : index === activeIndex ? "is-active" : ""}">${esc(stage)}</li>`).join("");
    }
    const pct = Math.round(((activeIndex + 1) / loadingStages.length) * 100);
    if (el.processingProgressBar) el.processingProgressBar.style.width = `${pct}%`;
    if (el.processingStageCount) el.processingStageCount.textContent = `${Math.min(activeIndex + 1, loadingStages.length)} / ${loadingStages.length}`;
    setStatus("loading", loadingStages[activeIndex] || loadingStages.at(-1));
  }

  function setProcessing(isProcessing) {
    if (el.processingPanel) el.processingPanel.hidden = !isProcessing;
    if (el.inputPanel) el.inputPanel.hidden = Boolean(isProcessing);
    document.body.classList.toggle("is-processing", Boolean(isProcessing));
    if (isProcessing) {
      renderLoadingStages(0);
      el.processingPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function startLoadingStages() {
    let index = 0;
    renderLoadingStages(index);
    return window.setInterval(() => {
      index = Math.min(index + 1, loadingStages.length - 1);
      renderLoadingStages(index);
    }, 700);
  }

  async function analyze() {
    updateInputReadiness();
    const raw = composeInputPayload();
    if (!raw) {
      toast("Add a URL, upload a file, paste signals, or load the sample first.");
      return;
    }
    if ((el.sourceUrlInput?.value || "").trim() && !isCompleteUrl(el.sourceUrlInput.value)) {
      toast("Use a complete source URL before running triage.");
      return;
    }

    setProcessing(true);
    if (el.analyze) {
      el.analyze.disabled = true;
      el.analyze.classList.add("is-loading");
      el.analyze.textContent = "Running AI triage…";
    }
    const stageTimer = startLoadingStages();

    try {
      const analysis = await fetchAi(raw);
      render(analysis);
      toast(`Live AI analyzed ${analysis.signalCount} signal${analysis.signalCount === 1 ? "" : "s"}.`);
    } catch (error) {
      console.warn(error);
      const analysis = localAnalyze(raw);
      analysis.diagnostics = {
        mode: "fallback",
        endpoint: "Browser fallback",
        model: "Local rules",
        error: error?.message || "Live route unavailable",
        generatedAt: analysis.createdAt || new Date().toISOString()
      };
      render(analysis);
      toast("AI route/key is not connected yet. Showing local fallback analysis.");
    } finally {
      window.clearInterval(stageTimer);
      setProcessing(false);
      if (el.analyze) {
        el.analyze.disabled = false;
        el.analyze.classList.remove("is-loading");
        el.analyze.textContent = "Run AI Triage";
      }
    }
  }

  function clearAll() {
    setResultsVisible(false);
    document.querySelectorAll(".tone-danger, .tone-warning, .tone-success, .tone-neutral").forEach((item) => item.classList.remove("tone-danger", "tone-warning", "tone-success", "tone-neutral"));
    if (el.input) el.input.value = "";
    if (el.sourceUrlInput) el.sourceUrlInput.value = "";
    if (el.saveSignalName) {
      el.saveSignalName.value = "";
      el.saveSignalName.disabled = false;
    }
    if (el.useDefaultSignalName) el.useDefaultSignalName.checked = false;
    if (el.emailRecipients) el.emailRecipients.value = "";
    if (el.generatedArtifactPanel) el.generatedArtifactPanel.hidden = true;
    state.sources = [];
    state.analysis = null;
    state.reviewed = false;
    state.expanded.clear();
    state.filters = { search: "", priority: "all", owner: "all", status: "all", cluster: "all", confidence: "all", matrix: "all", sort: "priorityDesc" };
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    renderSources();
    resetFilterInputs();
    setStatus("", "Real AI route ready");
    if (el.reviewBadge) el.reviewBadge.textContent = "Not run";
    if (el.reviewed) el.reviewed.disabled = true;
    if (el.export) el.export.disabled = true;
    if (el.exportCsv) el.exportCsv.disabled = true;
    if (el.exportMarkdown) el.exportMarkdown.disabled = true;
    if (el.exportAuditReport) el.exportAuditReport.disabled = true;
    if (el.saveSession) el.saveSession.disabled = true;
    if (el.copySummary) el.copySummary.disabled = true;
    if (el.copySlack) el.copySlack.disabled = true;
    if (el.copyEmailBrief) el.copyEmailBrief.disabled = true;
    if (el.copyTopJira) el.copyTopJira.disabled = true;
    if (el.copyReviewedActions) el.copyReviewedActions.disabled = true;
    if (el.copyHandoff) el.copyHandoff.disabled = true;
    if (el.continueToActions) el.continueToActions.disabled = true;
    if (el.continueToActionsBottom) el.continueToActionsBottom.disabled = true;
    if (el.saveSignal) el.saveSignal.disabled = true;
    [el.signalCount, el.highCount, el.clusterCount, el.statHigh, el.statDesign, el.statEngineering, el.statCustomer].forEach((item) => { if (item) item.textContent = "0"; });
    if (el.confidence) el.confidence.textContent = "—";
    if (el.summaryConfidence) el.summaryConfidence.textContent = "—";
    if (el.overallPriority) el.overallPriority.textContent = "—";
    if (el.primaryImpact) el.primaryImpact.textContent = "—";
    if (el.primaryOwner) el.primaryOwner.textContent = "—";
    if (el.priorityReason) el.priorityReason.textContent = "Run AI analysis to generate priority.";
    if (el.summaryText) el.summaryText.textContent = "AI-generated summary will appear here.";
    if (el.nextStep) el.nextStep.textContent = "Recommended action will appear here.";
    if (el.whyText) el.whyText.textContent = "AI reasoning will appear here.";
    if (el.decisionReadout) el.decisionReadout.textContent = "Run triage to get an executive readout of risk, owner concentration, confidence, and recommended next moves.";
    if (el.reviewProgressLabel) el.reviewProgressLabel.textContent = "0 of 0 reviewed";
    if (el.reviewProgressBar) el.reviewProgressBar.style.width = "0%";
    if (el.actionPlanList) el.actionPlanList.innerHTML = `<li>Run triage to generate recommended actions for escalation, validation, assignment, and follow-up.</li>`;
    if (el.actionPlanBadge) el.actionPlanBadge.textContent = "Waiting for triage";
    if (el.readinessScore) el.readinessScore.textContent = "—";
    if (el.beforeAfterText) el.beforeAfterText.textContent = "Before: messy notes, tickets, sources, and feedback. After: structured signals, clusters, risk scores, workflow states, and handoff-ready actions.";
    if (el.handoffReadinessText) el.handoffReadinessText.textContent = "Run triage to see whether the output is ready for assignment, needs validation, or has bottleneck risk.";
    if (el.recommendedNextMove) el.recommendedNextMove.innerHTML = `<span>Recommended next move</span><p>Run triage to get a focused recommendation for what to review first and what should happen before handoff.</p>`;
    [[el.statHighMeta, "0% need escalation or close review"], [el.statDesignMeta, "0% require UX/product validation"], [el.statEngineeringMeta, "0% may create an engineering bottleneck"], [el.statCustomerMeta, "0% affect customer experience or trust"]].forEach(([node, text]) => { if (node) node.textContent = text; });
    if (el.priorityMatrix) el.priorityMatrix.innerHTML = `<p class="chart-empty">Run triage to map signals by impact and effort.</p>`;
    if (el.reviewBoard) el.reviewBoard.innerHTML = `<p class="empty-state mb-0">Run triage to see signals grouped by recommended workflow state.</p>`;
    setViewMode("table");
    updateActionTemplates();
    if (el.priorityChartReadout) el.priorityChartReadout.textContent = "No priority pattern yet.";
    if (el.ownerChartReadout) el.ownerChartReadout.textContent = "No owner pattern yet.";
    if (el.confidenceChartReadout) el.confidenceChartReadout.textContent = "No confidence pattern yet.";
    if (el.table) el.table.innerHTML = `<tr><td colspan="7" class="empty-state">No AI analysis yet. Paste signals or load the sample set.</td></tr>`;
    if (el.clusterList) el.clusterList.innerHTML = `<p class="empty-state mb-0">Run triage to group related signals and expose likely duplicate issue patterns.</p>`;
    if (el.clusterBadge) el.clusterBadge.textContent = "No clusters yet";
    renderSignalCharts();
    setDiagnostics(null);
    updateSaveSignalState();
    updateEmailValidationState();
    updateInputReadiness();
    showStep(1, { noScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFilterInputs() {
    if (el.search) el.search.value = "";
    if (el.priorityFilter) el.priorityFilter.value = "all";
    if (el.ownerFilter) el.ownerFilter.innerHTML = `<option value="all">All owners</option>`;
    if (el.statusFilter) el.statusFilter.innerHTML = `<option value="all">All statuses</option>`;
    if (el.clusterFilter) el.clusterFilter.innerHTML = `<option value="all">All clusters</option>`;
    if (el.sortSelect) el.sortSelect.value = "priorityDesc";
  }

  function analysisPayload() {
    if (!state.analysis) return null;
    return {
      product: "AI NCC-1701-alpha",
      version: APP_VERSION,
      reviewed: state.reviewed,
      intakeText: el.input?.value || "",
      sourceUrlDraft: el.sourceUrlInput?.value || "",
      savedSignalName: el.saveSignalName?.value.trim() || "",
      sources: sourceMetadata(),
      sourceCounts: sourceCounts(),
      ...state.analysis
    };
  }

  function saveAnalysis() {
    const payload = analysisPayload();
    if (!payload) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function exportJson() {
    const payload = analysisPayload();
    if (!payload) return;
    downloadTextFile(
      `ai-ncc-1701-alpha-${APP_VERSION}-analysis-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  function exportCsv() {
    const payload = analysisPayload();
    if (!payload) return;
    const headers = ["id", "priority", "riskScore", "recommendedWorkflow", "impactCategory", "effortEstimate", "sourceStrength", "priorityMatrixBucket", "owner", "impact", "status", "confidence", "reviewState", "humanEdited", "cluster", "duplicateGroupId", "source", "signal", "confidenceReasons", "escalationReason", "evidence", "openQuestions", "overrideNote"];
    const rows = payload.signals.map((signal) => [
      signal.id,
      signal.priority,
      signal.riskScore,
      signal.recommendedWorkflow,
      signal.impactCategory,
      signal.effortEstimate,
      signal.sourceStrength,
      signal.priorityMatrixBucket,
      signal.owner,
      signal.impact,
      signal.status,
      signal.signalConfidence,
      signal.reviewState,
      signal.humanEdited ? "yes" : "no",
      signal.clusterTitle,
      signal.duplicateGroupId,
      signal.source,
      signal.text,
      (signal.confidenceReasons || []).join(" | "),
      signal.escalationReason || "",
      (signal.evidence || []).join(" | "),
      (signal.openQuestions || []).join(" | "),
      signal.overrideNote || ""
    ].map(csvEscape).join(","));

    downloadTextFile(
      `ai-ncc-1701-alpha-${APP_VERSION}-signals-${new Date().toISOString().slice(0, 10)}.csv`,
      [headers.join(","), ...rows].join("\n"),
      "text/csv"
    );
  }

  function exportMarkdown() {
    const payload = analysisPayload();
    if (!payload) return;
    const clusterLines = (payload.clusters || []).map((cluster) => [
      `### ${cluster.title}`,
      `- Priority: ${cluster.priority}`,
      `- Signals: ${cluster.signalCount}`,
      `- Average confidence: ${cluster.averageConfidence}%`,
      `- Owner: ${cluster.primaryOwner}`,
      `- Impact: ${cluster.primaryImpact}`,
      `- Duplicate group: ${cluster.duplicateGroupId || "No"}`,
      `- Reason: ${cluster.reason || "Related signals grouped for review."}`
    ].join("\n"));

    const signalLines = payload.signals.map((signal) => [
      `### Signal ${signal.id}: ${signal.priority}`,
      signal.text,
      "",
      `- Risk score: ${signal.riskScore}/99`,
      `- Recommended workflow: ${signal.recommendedWorkflow}`,
      `- Impact category: ${signal.impactCategory}`,
      `- Effort estimate: ${signal.effortEstimate}`,
      `- Source strength: ${signal.sourceStrength}`,
      `- Priority matrix: ${signal.priorityMatrixBucket}`,
      `- Owner: ${signal.owner}`,
      `- Impact: ${signal.impact}`,
      `- Status: ${signal.status}`,
      `- Review state: ${signal.reviewState}`,
      `- Confidence: ${signal.signalConfidence}%`,
      `- Cluster: ${signal.clusterTitle}`,
      `- Duplicate group: ${signal.duplicateGroupId || "No"}`,
      `- Source: ${signal.source}`,
      `- Confidence reasons: ${(signal.confidenceReasons || []).join("; ") || "None returned"}`,
      `- Escalation reason: ${signal.escalationReason || "None"}`,
      `- Evidence: ${(signal.evidence || []).join("; ") || "None returned"}`,
      `- Open questions: ${(signal.openQuestions || []).join("; ") || "None returned"}`,
      `- Human override note: ${signal.overrideNote || "None"}`
    ].join("\n"));

    const content = [
      `# AI NCC-1701-alpha ${APP_VERSION} Triage Report`,
      "",
      `Created: ${payload.createdAt}`,
      `Priority: ${payload.overallPriority}`,
      `Primary owner: ${payload.primaryOwner}`,
      `Primary impact: ${payload.primaryImpact}`,
      `Confidence: ${payload.confidence}%`,
      `Signals: ${payload.signalCount}`,
      `Clusters: ${payload.stats.clusterCount || 0}`,
      `Duplicate groups: ${payload.stats.duplicateGroupCount || 0}`,
      "",
      "## Executive Summary",
      payload.summary,
      "",
      "## Decision Summary",
      makeDecisionReadout(payload),
      "",
      "## Review Readiness",
      `${getReadinessScore(payload)}% readiness`,
      makeBeforeAfterText(payload),
      "",
      "## Action Plan",
      makeActionPlan(payload).map((action) => `- ${action}`).join("\n"),
      "",
      "## Suggested Next Step",
      payload.nextStep,
      "",
      "## Why This Recommendation",
      payload.why,
      "",
      "## Signal Clusters",
      clusterLines.join("\n\n") || "No clusters returned.",
      "",
      "## Signals",
      signalLines.join("\n\n")
    ].join("\n");

    downloadTextFile(
      `ai-ncc-1701-alpha-${APP_VERSION}-report-${new Date().toISOString().slice(0, 10)}.md`,
      content,
      "text/markdown"
    );
  }

  function countBy(items, getter) {
    return items.reduce((map, item) => {
      const key = getter(item) || "Unassigned";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
  }

  function rankedCountLines(counts, total, limit = 6) {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([label, count]) => `- ${label}: ${count} (${Math.round((count / Math.max(total, 1)) * 100)}%)`);
  }

  function sourceSummaryLines(payload) {
    const sources = payload.sources || [];
    if (!sources.length) return ["- Pasted text or local intake only"];
    return sources.slice(0, 12).map((source) => {
      const type = source.type || "source";
      const label = source.label || source.name || source.url || "Untitled source";
      const detail = source.url ? ` - ${source.url}` : source.name ? ` - ${source.name}` : "";
      return `- ${type}: ${label}${detail}`;
    });
  }

  function makeAuditReport(payload) {
    const signals = [...(payload.signals || [])];
    const clusters = [...(payload.clusters || [])];
    const total = signals.length;
    const high = signals.filter((signal) => signal.priority === "High");
    const medium = signals.filter((signal) => signal.priority === "Medium");
    const lowConfidence = signals.filter((signal) => Number(signal.signalConfidence || 0) < 65);
    const topRisks = [...signals].sort((a, b) => b.riskScore - a.riskScore || b.signalConfidence - a.signalConfidence).slice(0, 8);
    const duplicateClusters = clusters.filter((cluster) => cluster.signalCount > 1).slice(0, 6);
    const ownerCounts = countBy(signals, (signal) => signal.owner);
    const impactCounts = countBy(signals, (signal) => signal.impact || signal.impactCategory);
    const statusCounts = countBy(signals, (signal) => signal.recommendedWorkflow || signal.status);
    const readiness = getReadinessScore(payload);
    const generatedDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    const topRiskLines = topRisks.map((signal, index) => [
      `${index + 1}. ${signal.priority} priority - Risk ${signal.riskScore}/99 - ${signal.owner}`,
      `   - Signal: ${trunc(signal.text, 220)}`,
      `   - Impact: ${signal.impact}`,
      `   - Recommended workflow: ${signal.recommendedWorkflow || signal.status}`,
      `   - Evidence: ${(signal.evidence || []).slice(0, 2).join("; ") || "Evidence not available in this run."}`,
      `   - Open question: ${(signal.openQuestions || [])[0] || "Confirm owner, customer impact, and timing before assignment."}`
    ].join("\n"));

    const clusterLines = clusters.slice(0, 8).map((cluster, index) => [
      `${index + 1}. ${cluster.title}`,
      `   - Priority: ${cluster.priority}`,
      `   - Signals: ${cluster.signalCount}`,
      `   - Owner: ${cluster.primaryOwner}`,
      `   - Impact: ${cluster.primaryImpact}`,
      `   - Confidence: ${cluster.averageConfidence}%`,
      `   - Reason: ${cluster.reason || "Related signals grouped for review."}`
    ].join("\n"));

    const duplicateLines = duplicateClusters.length
      ? duplicateClusters.map((cluster) => `- ${cluster.title}: ${cluster.signalCount} related signals; review before creating separate tickets.`)
      : ["- No duplicate clusters were detected in this run."];

    const recommendedTicketLines = topRisks.slice(0, 5).map((signal, index) => [
      `### Ticket ${index + 1}: ${trunc(signal.text, 84)}`,
      "",
      `Priority: ${signal.priority}`,
      `Owner: ${signal.owner}`,
      `Impact: ${signal.impact}`,
      `Risk score: ${signal.riskScore}/99`,
      `Confidence: ${signal.signalConfidence}%`,
      "",
      "Description:",
      signal.text,
      "",
      "Acceptance / validation notes:",
      ...((signal.openQuestions || []).length ? signal.openQuestions.map((item) => `- ${item}`) : ["- Confirm customer impact, owner, and expected resolution path before assignment."])
    ].join("\n"));

    return [
      "# SignalDesk AI Product Feedback Triage Audit",
      "",
      `Generated: ${generatedDate}`,
      `Run mode: ${payload.mode === "api" ? "Live AI" : "Demo/fallback analysis"}`,
      `Review state: ${payload.reviewed ? "Human reviewed" : "Needs human review"}`,
      "",
      "## Executive Summary",
      "",
      payload.summary || "No executive summary was generated.",
      "",
      "## Decision Readout",
      "",
      makeDecisionReadout(payload),
      "",
      "## Key Metrics",
      "",
      `- Total signals reviewed: ${total}`,
      `- High-priority signals: ${high.length}`,
      `- Medium-priority signals: ${medium.length}`,
      `- Signal clusters: ${clusters.length}`,
      `- Possible duplicate clusters: ${duplicateClusters.length}`,
      `- Overall confidence: ${payload.confidence}%`,
      `- Review readiness: ${readiness}%`,
      `- Primary owner: ${payload.primaryOwner}`,
      `- Primary impact: ${payload.primaryImpact}`,
      "",
      "## Recommended Actions",
      "",
      ...makeActionPlan(payload).map((action) => `- ${action}`),
      "",
      "## Top Product / UX Risks",
      "",
      topRiskLines.join("\n\n") || "No risks were generated.",
      "",
      "## Theme Clusters",
      "",
      clusterLines.join("\n\n") || "No clusters were generated.",
      "",
      "## Duplicate / Repeated Issues",
      "",
      ...duplicateLines,
      "",
      "## Owner Routing",
      "",
      ...rankedCountLines(ownerCounts, total),
      "",
      "## Impact Areas",
      "",
      ...rankedCountLines(impactCounts, total),
      "",
      "## Recommended Workflow States",
      "",
      ...rankedCountLines(statusCounts, total),
      "",
      "## Items Needing Human Validation",
      "",
      ...(lowConfidence.length ? lowConfidence.slice(0, 10).map((signal) => `- ${signal.signalConfidence}% confidence - ${signal.owner}: ${trunc(signal.text, 160)}`) : ["- No low-confidence signals were flagged."]),
      "",
      "## Source Summary",
      "",
      ...sourceSummaryLines(payload),
      "",
      "## Jira-Ready Ticket Drafts",
      "",
      recommendedTicketLines.join("\n\n") || "No ticket drafts were generated.",
      "",
      "## Suggested Next Step",
      "",
      payload.nextStep || makeRecommendedNextMove(payload),
      "",
      "## Method Note",
      "",
      "SignalDesk AI converts pasted notes, uploaded source text, and source metadata into structured triage fields. The output is intended for human review before roadmap, customer, or engineering commitments are made."
    ].join("\n");
  }

  function exportAuditReport() {
    const payload = analysisPayload();
    if (!payload) return;
    const filename = `signaldesk-feedback-audit-${new Date().toISOString().slice(0, 10)}.md`;
    downloadTextFile(filename, makeAuditReport(payload), "text/markdown");
    toast("Feedback audit report created.");
  }

  function getSavedSessions() {
    try {
      const sessions = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "[]");
      return Array.isArray(sessions) ? sessions : [];
    } catch {
      return [];
    }
  }

  function persistSavedSessions(sessions) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
  }

  function savedSessionTitle(session) {
    const payload = session?.payload || {};
    const customTitle = session?.title || payload.savedSignalName || payload.signalName;
    if (customTitle && String(customTitle).trim()) return trunc(String(customTitle).trim(), 72);
    const firstSignal = payload.signals?.[0]?.text || payload.intakeText || payload.summary || "Saved signal review";
    return trunc(firstSignal, 72);
  }

  function savedSessionMeta(session) {
    const payload = session?.payload || {};
    const counts = payload.sourceCounts || {};
    const sourceParts = [];
    if (counts.files) sourceParts.push(`${counts.files} file${counts.files === 1 ? "" : "s"}`);
    if (counts.urls) sourceParts.push(`${counts.urls} URL${counts.urls === 1 ? "" : "s"}`);
    if (counts.pastedText || payload.intakeText) sourceParts.push("pasted text");
    const sourceLabel = sourceParts.length ? sourceParts.join(" + ") : "no saved sources";
    return [
      `${payload.signalCount || payload.signals?.length || 0} signal${(payload.signalCount || payload.signals?.length || 0) === 1 ? "" : "s"}`,
      sourceLabel,
      payload.reviewed ? "reviewed" : "not reviewed"
    ].join(" · ");
  }

  function renderSessionOptions() {
    const sessions = getSavedSessions();

    if (el.savedSessionCount) {
      el.savedSessionCount.textContent = `${sessions.length} saved`;
    }

    if (el.savedSessionList) {
      if (!sessions.length) {
        el.savedSessionList.innerHTML = `<p class="empty-state mb-0">No saved signals yet. Save the current signal review to add it to this list.</p>`;
      } else {
        el.savedSessionList.innerHTML = sessions.map((session) => {
          const savedAt = session.savedAt ? new Date(session.savedAt).toLocaleString() : "Saved signal";
          const priority = session.payload?.overallPriority || session.payload?.signals?.[0]?.priority || "Priority pending";
          return `
            <article class="saved-session-card" role="listitem">
              <div class="saved-session-copy">
                <span class="choice-kicker">${esc(savedAt)}</span>
                <h4>${esc(savedSessionTitle(session))}</h4>
                <p>${esc(savedSessionMeta(session))}</p>
              </div>
              <div class="saved-session-actions">
                <span class="saved-session-priority">${esc(priority)}</span>
                <button class="btn btn-outline-light btn-sm" type="button" data-session-action="load" data-session-id="${esc(session.id)}">Load</button>
                <button class="btn btn-ghost btn-sm" type="button" data-session-action="delete" data-session-id="${esc(session.id)}">Delete</button>
              </div>
            </article>
          `;
        }).join("");
      }
    }

    if (el.sessionSelect) {
      if (!sessions.length) {
        el.sessionSelect.innerHTML = `<option value="">No saved sessions</option>`;
      } else {
        el.sessionSelect.innerHTML = sessions.map((session) => {
          const label = `${new Date(session.savedAt).toLocaleString()} · ${session.payload?.signalCount || 0} signals · ${session.payload?.overallPriority || "Priority"}`;
          return `<option value="${esc(session.id)}">${esc(label)}</option>`;
        }).join("");
      }
    }

    if (el.loadSession) el.loadSession.disabled = !sessions.length;
    if (el.deleteSession) el.deleteSession.disabled = !sessions.length;
  }

  function saveSession() {
    updateSaveSignalState();
    const requestedName = el.saveSignalName?.value.trim() || "";
    if (!requestedName) {
      toast("Name this signal before saving, or use the default name.");
      return;
    }
    const payload = analysisPayload();
    if (!payload) return;
    payload.savedSignalName = requestedName;
    const sessions = getSavedSessions().filter((session) => session.payload?.createdAt !== payload.createdAt);
    const session = {
      id: slugId("session"),
      title: requestedName || savedSessionTitle({ payload }),
      savedAt: new Date().toISOString(),
      payload
    };
    persistSavedSessions([session, ...sessions]);
    renderSessionOptions();
    if (el.sessionSelect) el.sessionSelect.value = session.id;
    if (el.saveSignalName && !requestedName) el.saveSignalName.value = session.title;
    toast(`Saved signal: ${session.title}`);
  }

  function loadSelectedSession(sessionId = null) {
    const id = sessionId || el.sessionSelect?.value;
    if (!id) return;
    const session = getSavedSessions().find((item) => item.id === id);
    if (!session?.payload) return;
    if (el.input) el.input.value = session.payload.intakeText || "";
    if (el.sourceUrlInput) el.sourceUrlInput.value = session.payload.sourceUrlDraft || "";
    if (el.useDefaultSignalName) el.useDefaultSignalName.checked = false;
    if (el.saveSignalName) {
      el.saveSignalName.disabled = false;
      el.saveSignalName.value = session.title || session.payload.savedSignalName || savedSessionTitle(session);
    }
    state.sources = Array.isArray(session.payload.sources) ? session.payload.sources.map((source) => ({
      id: slugId("source"),
      dedupeKey: `${source.type}:${source.url || source.name || source.label}`.toLowerCase(),
      label: source.label || source.name || source.url || "Saved source",
      type: source.type || "file",
      url: source.url || null,
      name: source.name || null,
      mimeType: source.mimeType || null,
      size: source.size || null,
      extractable: Boolean(source.extractable),
      note: source.extractable ? "saved source" : "metadata only",
      content: "Saved source metadata restored. Original file text is not persisted for privacy."
    })) : [];
    renderSources();
    render(hydrate(session.payload));
    state.reviewed = Boolean(session.payload.reviewed);
    if (state.reviewed && el.reviewBadge) el.reviewBadge.textContent = "Reviewed";
    renderSessionOptions();
    updateSaveSignalState();
    updateEmailValidationState();
    updateInputReadiness();
    showStep(2);
    toast("Saved signal loaded.");
  }

  function deleteSelectedSession(sessionId = null) {
    const id = sessionId || el.sessionSelect?.value;
    if (!id) return;
    persistSavedSessions(getSavedSessions().filter((session) => session.id !== id));
    renderSessionOptions();
    toast("Saved signal deleted.");
  }

  async function copySummary() {
    if (!state.analysis) return;
    const highSignals = state.analysis.signals.filter((signal) => signal.priority === "High").slice(0, 3);
    const summary = [
      `# AI NCC-1701-alpha ${APP_VERSION} — Enterprise UX Triage Summary`,
      "",
      `Priority: ${state.analysis.overallPriority}`,
      `Primary Owner: ${state.analysis.primaryOwner}`,
      `Primary Impact: ${state.analysis.primaryImpact}`,
      `Confidence: ${state.analysis.confidence}%`,
      "",
      "## Decision Readout",
      makeDecisionReadout(state.analysis),
      "",
      "## Summary",
      state.analysis.summary,
      "",
      `Suggested next step: ${state.analysis.nextStep}`,
      "",
      "## Action plan",
      ...makeActionPlan(state.analysis).map((action) => `- ${action}`),
      "",
      highSignals.length ? "## Highest-priority signals" : "## Highest-priority signals",
      ...(highSignals.length ? highSignals.map((signal, index) => `${index + 1}. ${signal.text} — ${signal.owner} / ${signal.status}`) : ["No high-priority signals detected."])
    ].join("\n");

    createTextDocument(`executive-summary-${new Date().toISOString().slice(0, 10)}.md`, summary, "text/markdown");
    copyTextToClipboard(summary, "Executive summary document created and copied.");
  }

  function formatJiraTicket(signal) {
    return [
      `Title: ${trunc(signal.text, 90)}`,
      "",
      `Priority: ${signal.priority}`,
      `Risk Score: ${signal.riskScore}/99`,
      `Owner: ${signal.owner}`,
      `Impact: ${signal.impact}`,
      `Status: ${signal.status}`,
      `Recommended Workflow: ${signal.recommendedWorkflow}`,
      `Confidence: ${signal.signalConfidence}%`,
      `Cluster: ${signal.clusterTitle || "None"}`,
      "",
      "Description:",
      signal.text,
      "",
      "Evidence:",
      ...(signal.evidence?.length ? signal.evidence.map((item) => `- ${item}`) : ["- No evidence bullets returned."]),
      "",
      "Open Questions:",
      ...(signal.openQuestions?.length ? signal.openQuestions.map((item) => `- ${item}`) : ["- No open questions returned."]),
      "",
      `Human Override Note: ${signal.overrideNote || "None"}`
    ].join("\n");
  }

  function formatSlackUpdate(signal) {
    return [
      `*${signal.priority} priority · ${signal.owner} · Risk ${signal.riskScore}/99*`,
      `${signal.text}`,
      `Impact: ${signal.impact}`,
      `Recommended workflow: ${signal.recommendedWorkflow}`,
      `Confidence: ${signal.signalConfidence}%`,
      signal.clusterTitle ? `Cluster: ${signal.clusterTitle}` : "",
      signal.overrideNote ? `Human note: ${signal.overrideNote}` : ""
    ].filter(Boolean).join("\n");
  }

  function getTopSignal() {
    if (!state.analysis?.signals?.length) return null;
    return [...state.analysis.signals].sort((a, b) => b.riskScore - a.riskScore || b.signalConfidence - a.signalConfidence)[0];
  }

  function makeCustomerEmailTemplate() {
    if (!state.analysis) {
      return {
        subject: "AI triage follow-up",
        body: "Hi,\n\nI reviewed the signal and will send a concise update once the triage is complete.\n\nThanks,"
      };
    }
    const topSignals = [...state.analysis.signals].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
    const subjectTarget = topSignals[0] ? trunc(topSignals[0].impact || topSignals[0].text, 56) : "signal review";
    const subject = `Follow-up on ${subjectTarget}`;
    const validationItems = state.analysis.signals
      .filter((signal) => Number(signal.signalConfidence || 0) < 65 || (Array.isArray(signal.openQuestions) && signal.openQuestions.length))
      .slice(0, 3);
    const body = [
      "Hi,",
      "",
      "I reviewed the signal and related context. Here is the current triage summary:",
      "",
      makeDecisionReadout(state.analysis),
      "",
      "What we found:",
      ...topSignals.map((signal) => `- ${signal.priority} priority · ${signal.owner}: ${trunc(signal.text, 150)}`),
      "",
      "Recommended next steps:",
      ...makeActionPlan(state.analysis).map((item) => `- ${item}`),
      "",
      "Items still needing validation:",
      ...(validationItems.length ? validationItems.map((signal) => `- ${trunc(signal.text, 130)}`) : ["- No major validation gaps flagged in the current run."]),
      "",
      "I’ll keep this focused on confirmed items and flag anything that still needs validation before ownership or timing is finalized.",
      "",
      "Thanks,"
    ].join("\n");
    return { subject, body };
  }

  function updateActionTemplates() {
    const email = makeCustomerEmailTemplate();
    if (el.emailSubject) el.emailSubject.value = email.subject;
    if (el.emailBody) el.emailBody.value = email.body;
    const topSignal = getTopSignal();
    if (el.jiraPreview) el.jiraPreview.textContent = topSignal ? formatJiraTicket(topSignal) : "Run triage to generate a ticket preview.";
    if (el.slackPreview) el.slackPreview.textContent = state.analysis ? [
      `AI NCC-1701-alpha ${APP_VERSION} triage update`,
      makeDecisionReadout(state.analysis),
      "",
      "Recommended actions:",
      ...makeActionPlan(state.analysis).map((item) => `• ${item}`)
    ].join("\n") : "Run triage to generate a team update.";
    updateEmailValidationState();
    if (el.executivePreview) el.executivePreview.textContent = state.analysis ? [
      `AI NCC-1701-alpha ${APP_VERSION} executive summary`,
      `Signals: ${state.analysis.signalCount}`,
      `Priority: ${state.analysis.overallPriority}`,
      `Primary owner: ${state.analysis.primaryOwner}`,
      `Confidence: ${state.analysis.confidence}%`,
      "",
      state.analysis.summary,
      "",
      `Next step: ${state.analysis.nextStep}`
    ].join("\n") : "Run triage to generate an executive summary.";
  }

  function encodeMailRecipients(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((email) => encodeURIComponent(email))
      .join(",");
  }

  function makeMailtoSafeBody(body) {
    const text = String(body || "").trim();
    // Most browsers/mail clients handle short mailto bodies reliably.
    // Keep the draft concise so the Create Email Template button opens an email
    // instead of falling back to a downloaded document.
    if (text.length <= 1200) return text;
    return `${text.slice(0, 1150).trim()}\n\n[Email body shortened for mail client compatibility. Use the handoff package or exports for the full triage details.]`;
  }

  function openEmailDraft() {
    if (!updateEmailValidationState()) {
      toast("Fix incomplete recipient email addresses or leave recipients blank before creating the email template.");
      return;
    }
    const recipients = el.emailRecipients?.value.trim() || "";
    const email = makeCustomerEmailTemplate();
    const subject = el.emailSubject?.value || email.subject;
    const body = makeMailtoSafeBody(el.emailBody?.value || email.body);
    const encodedRecipients = encodeMailRecipients(recipients);
    const href = `mailto:${encodedRecipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const link = document.createElement("a");
    link.href = href;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    copyTextToClipboard([
      recipients ? `To: ${recipients}` : "To: [add recipients]",
      `Subject: ${subject}`,
      "",
      body
    ].join("\n"), recipients ? "Opening email in your default mail app and copying the template." : "Opening email in your default mail app with recipients left blank and copying the template.");
  }

  function safeFilenamePart(value, fallback = "signal") {
    return String(value || fallback)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || fallback;
  }

  function createTextDocument(filename, content, type = "text/plain") {
    downloadTextFile(filename, content, type);
  }

  function createEmailDocument(subject, body, recipients = "") {
    const eml = [
      `To: ${recipients || ""}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body
    ].join("\r\n");
    createTextDocument(`customer-email-brief-${new Date().toISOString().slice(0, 10)}.eml`, eml, "message/rfc822");
  }

  async function copyTextToClipboard(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage);
    } catch {
      toast("Document created. Copy permission was blocked by the browser.");
    }
  }

  function signalById(id) {
    return state.analysis?.signals.find((signal) => signal.id === Number(id));
  }

  function copyJiraTicket(id) {
    const signal = signalById(id);
    if (!signal) return;
    const ticket = formatJiraTicket(signal);
    createTextDocument(`jira-ticket-${safeFilenamePart(signal.text)}.md`, ticket, "text/markdown");
    copyTextToClipboard(ticket, "Jira ticket document created and copied.");
  }

  function copySignalSlack(id) {
    const signal = signalById(id);
    if (!signal) return;
    const update = formatSlackUpdate(signal);
    createTextDocument(`team-update-${safeFilenamePart(signal.text)}.txt`, update, "text/plain");
    copyTextToClipboard(update, "Team update document created and copied.");
  }

  function copySlackUpdate() {
    if (!state.analysis) return;
    const actions = makeActionPlan(state.analysis).map((item) => `• ${item}`).join("\n");
    const text = [
      `*AI NCC-1701-alpha ${APP_VERSION} triage update*`,
      makeDecisionReadout(state.analysis),
      "",
      "*Recommended actions*",
      actions
    ].join("\n");
    createTextDocument(`team-update-${new Date().toISOString().slice(0, 10)}.txt`, text, "text/plain");
    copyTextToClipboard(text, "Team update document created and copied.");
  }

  function copyEmailBrief() {
    if (!state.analysis) return;
    openEmailDraft();
  }

  function copyTopJiraTicket() {
    if (!state.analysis?.signals?.length) return;
    const topSignal = getTopSignal();
    const ticket = formatJiraTicket(topSignal);
    createTextDocument(`jira-ticket-${safeFilenamePart(topSignal.text)}.md`, ticket, "text/markdown");
    copyTextToClipboard(ticket, "Top Jira ticket document created and copied.");
  }

  function copyReviewedActions() {
    if (!state.analysis) return;
    const reviewed = state.analysis.signals.filter((signal) => signal.reviewed || signal.overrideNote || ["Accepted", "Assigned", "Resolved"].includes(signal.status));
    const rows = (reviewed.length ? reviewed : state.analysis.signals.filter((signal) => signal.priority === "High")).map((signal) => `- ${signal.priority} · ${signal.owner} · Risk ${signal.riskScore}/99: ${trunc(signal.text, 140)} — ${signal.recommendedWorkflow}`);
    const text = [`# AI NCC-1701-alpha ${APP_VERSION} Reviewed Actions`, "", ...rows].join("\n");
    createTextDocument(`reviewed-actions-${new Date().toISOString().slice(0, 10)}.md`, text, "text/markdown");
    copyTextToClipboard(text, reviewed.length ? "Reviewed actions document created and copied." : "High-priority actions document created and copied.");
  }


  function makeHandoffPackage(analysis) {
    if (!analysis) return "";
    const highSignals = [...analysis.signals].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
    const needsReview = analysis.signals.filter((signal) => signal.signalConfidence < 65 || signal.reviewState === "Needs verification").slice(0, 5);
    const ownerCounts = analysis.signals.reduce((map, signal) => {
      map[signal.owner] = (map[signal.owner] || 0) + 1;
      return map;
    }, {});
    const ownerLines = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1]).map(([owner, count]) => `- ${owner}: ${count}`).join("\n") || "- No owners detected";
    return [
      `AI NCC-1701-alpha ${APP_VERSION} Handoff Package`,
      "",
      "Executive summary:",
      analysis.summary,
      "",
      "Decision summary:",
      makeDecisionReadout(analysis),
      "",
      `Review readiness: ${getReadinessScore(analysis)}%`,
      makeBeforeAfterText(analysis),
      "",
      "Action plan:",
      ...makeActionPlan(analysis).map((action) => `- ${action}`),
      "",
      "Top risks:",
      ...(highSignals.length ? highSignals.map((signal) => `- ${signal.priority} · Risk ${signal.riskScore}/99 · ${signal.owner}: ${trunc(signal.text, 150)}`) : ["- No high-risk signals detected."]),
      "",
      "Items needing human review:",
      ...(needsReview.length ? needsReview.map((signal) => `- ${signal.signalConfidence}% confidence · ${signal.sourceStrength} source · ${trunc(signal.text, 140)}`) : ["- No low-confidence signals detected."]),
      "",
      "Owner routing:",
      ownerLines,
      "",
      "Priority matrix:",
      ...["Do now", "Plan", "Quick win", "Defer"].map((bucket) => `- ${bucket}: ${analysis.signals.filter((signal) => signal.priorityMatrixBucket === bucket).length}`)
    ].join("\n");
  }

  function copyHandoffPackage() {
    if (!state.analysis) return;
    const handoff = makeHandoffPackage(state.analysis);
    createTextDocument(`handoff-package-${new Date().toISOString().slice(0, 10)}.md`, handoff, "text/markdown");
    copyTextToClipboard(handoff, "Handoff package document created and copied.");
  }

  function loadScenario(name = "support") {
    if (!el.input) return;
    const key = scenarioSamples[name] ? name : "support";
    el.input.value = scenarioSamples[key];
    updateIntakeStatus();
    const label = key.replace(/^[a-z]/, (letter) => letter.toUpperCase());
    toast(`${label} scenario loaded.`);
  }

  function loadSample() {
    loadScenario("support");
  }
  function setDrawerTopic(topic = "how") {
    const activeTopic = topic === "principles" ? "principles" : "how";
    document.querySelectorAll("[data-drawer-section]").forEach((section) => {
      section.classList.toggle("is-active", section.dataset.drawerSection === activeTopic);
    });
    document.querySelectorAll(".drawer-tab[data-drawer-topic]").forEach((button) => {
      const isActive = button.dataset.drawerTopic === activeTopic;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    if (el.drawerTitle) {
      el.drawerTitle.textContent = activeTopic === "principles" ? "Design principles" : "How the system works";
    }
  }

  function openDrawer(topic = "how") {
    if (!el.drawer) return;
    setDrawerTopic(topic);
    el.drawer.classList.add("is-open");
    el.drawer.setAttribute("aria-hidden", "false");
    if (el.drawerBackdrop) el.drawerBackdrop.hidden = false;
    document.body.classList.add("drawer-open");
  }

  function closeDrawer() {
    if (!el.drawer) return;
    el.drawer.classList.remove("is-open");
    el.drawer.setAttribute("aria-hidden", "true");
    if (el.drawerBackdrop) el.drawerBackdrop.hidden = true;
    document.body.classList.remove("drawer-open");
  }


  function bindFileDrop() {
    const targets = [el.fileDropZone, el.input].filter(Boolean);
    targets.forEach((target) => {
      ["dragenter", "dragover"].forEach((eventName) => {
        target.addEventListener(eventName, (event) => {
          event.preventDefault();
          el.fileDropZone?.classList.add("is-file-dragging");
          el.input?.classList.add("is-file-dragging");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        target.addEventListener(eventName, (event) => {
          event.preventDefault();
          el.fileDropZone?.classList.remove("is-file-dragging");
          el.input?.classList.remove("is-file-dragging");
        });
      });

      target.addEventListener("drop", (event) => {
        handleFiles(event.dataTransfer.files);
      });
    });

    el.fileDropZone?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        el.fileInput?.click();
      }
    });

    el.chooseFiles?.addEventListener("click", () => el.fileInput?.click());
    el.fileInput?.addEventListener("change", (event) => {
      handleFiles(event.target.files);
      event.target.value = "";
    });
  }

  function bindEvents() {
    el.addUrl?.addEventListener("click", addUrlSource);
    el.sourceUrlInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addUrlSource();
      }
    });

    el.sourceTray?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-source]");
      if (!button) return;
      state.sources = state.sources.filter((source) => source.id !== button.dataset.removeSource);
      renderSources();
      toast("Source removed.");
    });

    el.analyze?.addEventListener("click", analyze);
    el.sample?.addEventListener("click", loadSample);
    el.sampleTop?.addEventListener("click", loadSample);
    document.querySelectorAll("[data-sample]").forEach((button) => {
      button.addEventListener("click", () => loadScenario(button.dataset.sample));
    });
    document.querySelectorAll("[data-drawer-topic]").forEach((button) => {
      button.addEventListener("click", () => openDrawer(button.dataset.drawerTopic));
    });
    el.drawerClose?.addEventListener("click", closeDrawer);
    el.drawerBackdrop?.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && el.drawer?.classList.contains("is-open")) closeDrawer();
    });
    el.input?.addEventListener("input", updateIntakeStatus);
    el.sourceUrlInput?.addEventListener("input", updateIntakeStatus);
    el.emailRecipients?.addEventListener("input", updateEmailValidationState);
    el.saveSignalName?.addEventListener("input", updateSaveSignalState);
    el.useDefaultSignalName?.addEventListener("change", () => {
      const useDefault = Boolean(el.useDefaultSignalName?.checked);
      if (el.saveSignalName) {
        el.saveSignalName.disabled = useDefault;
        if (useDefault) {
          el.saveSignalName.value = makeDefaultSignalName();
          toast("Default signal name enabled.");
        } else {
          el.saveSignalName.value = "";
          toast("Custom signal naming enabled.");
        }
      }
      updateSaveSignalState();
    });
    el.stepCards?.forEach((card) => {
      const activate = () => {
        const step = Number(card.dataset.step || 1);
        if (step > 1 && !state.analysis) {
          toast("Run AI triage before moving to that step.");
          return;
        }
        showStep(step);
      };
      card.addEventListener("click", activate);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
    el.continueToActions?.addEventListener("click", () => showStep(3));
    el.continueToActionsBottom?.addEventListener("click", () => showStep(3));
    el.saveSignal?.addEventListener("click", saveSession);
    el.startNewSignal?.addEventListener("click", clearAll);
    el.clear?.addEventListener("click", clearAll);
    el.export?.addEventListener("click", exportJson);
    el.exportCsv?.addEventListener("click", exportCsv);
    el.exportMarkdown?.addEventListener("click", exportMarkdown);
    el.exportAuditReport?.addEventListener("click", exportAuditReport);
    el.saveSession?.addEventListener("click", saveSession);
    el.savedSessionList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-session-action][data-session-id]");
      if (!button) return;
      const id = button.dataset.sessionId;
      if (button.dataset.sessionAction === "load") loadSelectedSession(id);
      if (button.dataset.sessionAction === "delete") deleteSelectedSession(id);
    });
    el.loadSession?.addEventListener("click", () => loadSelectedSession());
    el.deleteSession?.addEventListener("click", () => deleteSelectedSession());
    el.copySummary?.addEventListener("click", copySummary);
    el.copySlack?.addEventListener("click", copySlackUpdate);
    el.copyEmailBrief?.addEventListener("click", copyEmailBrief);
    el.copyTopJira?.addEventListener("click", copyTopJiraTicket);
    el.copyReviewedActions?.addEventListener("click", copyReviewedActions);
    el.copyHandoff?.addEventListener("click", copyHandoffPackage);

    document.querySelectorAll(".chart-bars").forEach((chart) => {
      chart.addEventListener("click", (event) => {
        const row = event.target.closest("[data-chart-filter]");
        if (!row) return;
        applyChartFilter(row.dataset.chartFilter, row.dataset.chartValue);
      });
    });

    el.priorityMatrix?.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-matrix-filter]");
      if (!cell) return;
      state.filters.matrix = cell.dataset.matrixFilter || "all";
      renderTable();
      toast(`Filtered table by ${state.filters.matrix}.`);
    });

    el.tableView?.addEventListener("click", () => setViewMode("table"));
    el.boardView?.addEventListener("click", () => setViewMode("board"));

    el.reviewed?.addEventListener("click", () => {
      state.reviewed = true;
      if (state.analysis?.signals) {
        state.analysis.signals = state.analysis.signals.map((signal) => enrichSignal({ ...signal, reviewed: true, reviewState: "Reviewed" }));
      }
      if (el.reviewBadge) el.reviewBadge.textContent = "Reviewed";
      if (el.reviewed) el.reviewed.disabled = true;
      updateSummary();
      renderTable();
      saveAnalysis();
      toast("Marked as human-reviewed.");
    });

    el.table?.addEventListener("click", (event) => {
      const ticketButton = event.target.closest("[data-copy-ticket]");
      if (ticketButton) {
        copyJiraTicket(ticketButton.dataset.copyTicket);
        return;
      }
      const slackButton = event.target.closest("[data-copy-signal-slack]");
      if (slackButton) {
        copySignalSlack(slackButton.dataset.copySignalSlack);
        return;
      }
      const button = event.target.closest(".detail-toggle");
      if (!button) return;
      const id = Number(button.dataset.id);
      if (state.expanded.has(id)) state.expanded.delete(id);
      else state.expanded.add(id);
      renderTable();
    });

    el.table?.addEventListener("change", (event) => {
      const control = event.target.closest(".signal-edit");
      if (!control) return;
      updateSignal(control.dataset.id, control.dataset.field, control.value);
    });

    el.search?.addEventListener("input", (event) => {
      state.filters.search = event.target.value;
      renderTable();
    });
    el.priorityFilter?.addEventListener("change", (event) => {
      state.filters.priority = event.target.value;
      renderTable();
    });
    el.ownerFilter?.addEventListener("change", (event) => {
      state.filters.owner = event.target.value;
      renderTable();
    });
    el.statusFilter?.addEventListener("change", (event) => {
      state.filters.status = event.target.value;
      renderTable();
    });
    el.clusterFilter?.addEventListener("change", (event) => {
      state.filters.cluster = event.target.value;
      renderTable();
    });
    el.sortSelect?.addEventListener("change", (event) => {
      state.filters.sort = event.target.value;
      renderTable();
    });
    el.clearFilters?.addEventListener("click", () => {
      state.filters = { search: "", priority: "all", owner: "all", status: "all", cluster: "all", confidence: "all", matrix: "all", sort: "priorityDesc" };
      resetFilterInputs();
      renderFilterOptions();
      renderClusters();
      renderTable();
    });

    // Theme toggle is not present in this markup, but this remains guarded for older markup.
    el.theme?.addEventListener("click", () => {
      const next = el.html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      el.html.setAttribute("data-theme", next);
      localStorage.setItem("ai-ncc-1701:theme", next);
    });
  }

  function restoreSavedAnalysis() {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      const saved = JSON.parse(savedRaw || "null");
      if (!saved?.signals) return;
      state.sources = Array.isArray(saved.sources) ? saved.sources.map((source) => ({
        id: slugId("source"),
        dedupeKey: `${source.type}:${source.url || source.name || source.label}`.toLowerCase(),
        label: source.label || source.name || source.url || "Saved source",
        type: source.type || "file",
        url: source.url || null,
        name: source.name || null,
        mimeType: source.mimeType || null,
        size: source.size || null,
        extractable: Boolean(source.extractable),
        note: source.extractable ? "saved source" : "metadata only",
        content: "Saved source metadata restored. Original file text is not persisted for privacy."
      })) : [];
      renderSources();
      render(hydrate(saved));
      state.reviewed = Boolean(saved.reviewed);
      if (state.reviewed && el.reviewBadge) el.reviewBadge.textContent = "Reviewed";
    } catch (error) {
      console.warn(error);
    }
  }

  bindFileDrop();
  bindEvents();
  renderSources();
  renderSessionOptions();
  setViewMode("table");
  updateActionTemplates();
  setResultsVisible(false);
  showStep(1, { noScroll: true });

  const theme = localStorage.getItem("ai-ncc-1701:theme") || localStorage.getItem("signaldesk:theme");
  if (theme) el.html.setAttribute("data-theme", theme);

  restoreSavedAnalysis();
})();
