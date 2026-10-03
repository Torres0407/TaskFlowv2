import React, { useState } from 'react';
import { TaskFlowProvider, useTaskFlow } from './mock-data/store';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ErrorBanner } from './components/common/ErrorBanner';
import { InviteModal } from './components/common/InviteModal';
import { NewProjectModal } from './components/projects/NewProjectModal';
import { TaskDrawer } from './components/kanban/TaskDrawer';
import { CreateTaskModal } from './components/projects/CreateTaskModal';
import { AssistantPanel } from './components/assistant/AssistantPanel';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectPage } from './pages/ProjectPage';
import { TeamSettingsPage } from './pages/TeamSettingsPage';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    currentPage,
    selectedTask,
    setSelectedTask,
    selectedProjectId,
  } = useTaskFlow();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuickCreateTaskOpen, setIsQuickCreateTaskOpen] = useState(false);

  // If not logged in or in auth page, render auth view
  if (!currentUser || currentPage === 'auth') {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-200">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCreateTask={
            currentPage === 'project'
              ? () => setIsQuickCreateTaskOpen(true)
              : undefined
          }
        />

        {/* Global API Error Banner with Retry */}
        <ErrorBanner />

        {/* View Router */}
        <main className="flex-1 pb-16">
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'project' && <ProjectPage />}
          {currentPage === 'team-settings' && <TeamSettingsPage />}
        </main>
      </div>

      {/* Slide-out Task Detail Drawer */}
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      {/* Workspace Invite Member Modal */}
      <InviteModal />

      {/* New Project Modal */}
      <NewProjectModal />

      {/* Quick Create Task Modal (when in project view) */}
      {selectedProjectId && (
        <CreateTaskModal
          isOpen={isQuickCreateTaskOpen}
          onClose={() => setIsQuickCreateTaskOpen(false)}
          projectId={selectedProjectId}
        />
      )}

      {/* Floating Gemini AI Assistant Panel */}
      <AssistantPanel />
    </div>
  );
};

export default function App() {
  return (
    <TaskFlowProvider>
      <MainLayout />
    </TaskFlowProvider>
  );
}
