import React, { useEffect, useState } from "react";
import { NexusProvider } from "./context/NexusContext.jsx";

import OverviewDashboard from "./views/OverviewDashboard.jsx";
import CRMContacts from "./views/CRMContacts.jsx";
import AICommandCenter from "./views/AICommandCenter.jsx";
import VisualWorkflowBuilder from "./views/VisualWorkflowBuilder.jsx";
import Websites from "./views/Websites.jsx";
import Webinars from "./views/Webinars.jsx";
import Marketing from "./views/Marketing.jsx";
import Approvals from "./views/Approvals.jsx";

import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import NavigationDrawer from "./components/NavigationDrawer.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";

function AppContent() {
  const [currentTab, setCurrentTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigateToTab = (tab) => {
    setCurrentTab(tab);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleGlobalShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((previous) => !previous);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcut);
    };
  }, []);

  const renderCurrentPage = () => {
    switch (currentTab) {
      case "overview":
        return (
          <OverviewDashboard
            onNavigateTab={navigateToTab}
            onOpenReviewModal={() => navigateToTab("approvals")}
          />
        );

      case "ai-command-center":
        return <AICommandCenter />;

      case "crm":
        return <CRMContacts />;

      case "workflows":
        return <VisualWorkflowBuilder onNavigateTab={navigateToTab} />;

      case "websites":
        return <Websites />;

      case "webinars":
        return <Webinars />;

      case "marketing":
        return <Marketing />;

      case "approvals":
        return <Approvals />;

      default:
        return (
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-[#3659C9]">
                construction
              </span>
              <h1 className="mt-4 text-2xl font-bold text-[#20242C]">
                Module coming soon
              </h1>
              <p className="mt-2 text-sm text-[#697386]">
                This module is not connected yet.
              </p>
              <button
                onClick={() => navigateToTab("overview")}
                className="mt-6 rounded-lg bg-[#3659C9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2948AB]"
              >
                Back to Overview
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header currentTab={currentTab} onOpenMenu={() => setIsMenuOpen(true)} />

      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentTab={currentTab}
        onNavigateTab={navigateToTab}
      />

      <GlobalSearch
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateToTab}
      />

      <main className="min-h-screen pb-24 pt-[132px]">
        {renderCurrentPage()}
      </main>

      <BottomNav currentTab={currentTab} onSelectTab={navigateToTab} />
    </div>
  );
}

export default function App() {
  return (
    <NexusProvider>
      <AppContent />
    </NexusProvider>
  );
}

