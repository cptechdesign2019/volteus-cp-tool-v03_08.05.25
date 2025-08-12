"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import type { AnyTask, HelpRequest, InternalTask, TaskId, TimeEntry } from "./types";
import { TaskDetailPage } from "./components/TaskDetailPage";
import { TaskTable } from "./components/TaskTable";
import { Sidebar } from "./components/Sidebar";
import { ConfirmModal } from "./components/ConfirmModal";
import { RequestHelpModal } from "./components/RequestHelpModal";
import { TimeEntriesPage } from "./components/TimeEntriesPage";
import { HelpRequestsPage } from "./components/HelpRequestsPage";
import { InternalTaskCard } from "./components/InternalTaskCard";
import { TaskModuleHeader } from "./components/TaskModuleHeader";
import { demoTasks, demoInternalTasks, demoHelpRequests } from "./store/demoData";
import { todayLocalString, tomorrowLocalString } from "./utils/date";

export function FieldApp() {
  const [tasks, setTasks] = useState<AnyTask[]>(demoTasks);
  const [internalTasks] = useState<InternalTask[]>(demoInternalTasks);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(demoHelpRequests);
  const [activeClockId, setActiveClockId] = useState<TaskId | null>(null);
  const [clockInTimeIso, setClockInTimeIso] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null);
  const [dashboardTab, setDashboardTab] = useState<"All" | "Projects" | "Service Calls">("All");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingClockOutId, setPendingClockOutId] = useState<TaskId | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showTomorrowConfirmModal, setShowTomorrowConfirmModal] = useState<boolean>(false);
  const [pendingClockInId, setPendingClockInId] = useState<TaskId | null>(null);
  const [helpModalDefaultTaskId, setHelpModalDefaultTaskId] = useState<TaskId | null>(null);
  const currentUser = "John Doe";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePageChange = (pageName: string) => {
    setSelectedTaskId(null);
    setActivePage(pageName);
  };

  const performClockOut = (taskId: TaskId) => {
    const endTime = new Date();
    const allTasks = [...tasks, ...internalTasks];
    const taskToClockOut = allTasks.find((t) => t.id === taskId);
    if (taskToClockOut && clockInTimeIso) {
      const newEntry: TimeEntry = {
        id: Date.now(),
        taskName: taskToClockOut.name,
        customer: (taskToClockOut as AnyTask).customer,
        startTime: clockInTimeIso,
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - new Date(clockInTimeIso).getTime(),
      };
      setTimeEntries((prev) => [newEntry, ...prev]);
    }
    setActiveClockId(null);
    setClockInTimeIso(null);
  };

  const executeClockIn = (taskId: TaskId) => {
    if (activeClockId && activeClockId !== taskId) {
      performClockOut(activeClockId);
    }
    setActiveClockId(taskId);
    setClockInTimeIso(new Date().toISOString());
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "In Progress" } : t)));
  };

  const handleClockInRequest = (taskId: TaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const todayString = todayLocalString();
    const tomorrowString = tomorrowLocalString();

    if (task && task.startDate === tomorrowString && todayString !== tomorrowString) {
      setPendingClockInId(taskId);
      setShowTomorrowConfirmModal(true);
    } else {
      executeClockIn(taskId);
    }
  };

  const confirmClockInTomorrow = () => {
    if (pendingClockInId == null) return;
    executeClockIn(pendingClockInId);
    setShowTomorrowConfirmModal(false);
    setPendingClockInId(null);
  };

  const handleClockOutRequest = (taskId: TaskId) => {
    setPendingClockOutId(taskId);
    setShowConfirmModal(true);
  };

  const confirmClockOut = () => {
    if (pendingClockOutId == null) return;
    performClockOut(pendingClockOutId);
    setShowConfirmModal(false);
    setPendingClockOutId(null);
  };

  const handleRequestHelp = (defaultTaskId: TaskId | null = null) => {
    setHelpModalDefaultTaskId(defaultTaskId);
    setShowHelpModal(true);
  };

  const handleHelpSubmit = ({ selectedTask, recipient, message }: { selectedTask: TaskId; recipient: string; message: string }) => {
    const task = tasks.find((t) => String(t.id) === String(selectedTask));
    if (!task) return;
    const newRequest: HelpRequest = {
      id: Date.now(),
      taskId: task.id,
      taskName: task.name,
      recipient,
      status: "Active",
      thread: [{ user: currentUser, text: message, timestamp: new Date().toISOString() }],
    };
    setHelpRequests((prev) => [newRequest, ...prev]);
    setNotification(`Help request for "${task.name}" sent to the ${recipient}.`);
    setShowHelpModal(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleHelpReply = (requestId: number, replyText: string) => {
    setHelpRequests((requests) =>
      requests.map((req) => {
        if (req.id === requestId) {
          const newThread = [...req.thread, { user: currentUser, text: replyText, timestamp: new Date().toISOString() }];
          return { ...req, thread: newThread };
        }
        return req;
      })
    );
  };

  const onUpdateTask = (taskId: TaskId, updatedData: Partial<AnyTask>) => {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? ({ ...task, ...updatedData } as AnyTask) : task)));
  };

  const activeTask = useMemo(() => [...tasks, ...internalTasks].find((t) => t.id === activeClockId) ?? null, [tasks, internalTasks, activeClockId]);
  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) ?? null, [tasks, selectedTaskId]);
  const taskToConfirm = useMemo(() => [...tasks, ...internalTasks].find((t) => t.id === pendingClockOutId) ?? null, [tasks, internalTasks, pendingClockOutId]);

  const todayString = todayLocalString();
  const tomorrowString = tomorrowLocalString();

  const filteredTasks = useMemo(() => {
    const filterByTab = (task: AnyTask) => {
      if (dashboardTab === "Projects") return task.type === "Project";
      if (dashboardTab === "Service Calls") return task.type === "Service Call";
      return true;
    };
    const todaysTasks = tasks.filter((task) => task.startDate === todayString && task.status !== "Completed" && filterByTab(task));
    const tomorrowsTasks = tasks.filter((task) => task.startDate === tomorrowString && task.status !== "Completed" && filterByTab(task));
    return { todaysTasks, tomorrowsTasks };
  }, [tasks, dashboardTab, todayString, tomorrowString]);

  const renderContent = () => {
    if (selectedTask) {
      return (
        <TaskDetailPage
          task={selectedTask}
          onBack={() => setSelectedTaskId(null)}
          activeClockId={activeClockId}
          onUpdateTask={onUpdateTask}
          onHelpSubmit={handleHelpSubmit}
          currentUser={currentUser}
        />
      );
    }

    if (activePage === "Dashboard") {
      return (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {internalTasks.map((task) => (
              <InternalTaskCard key={String(task.id)} task={task} onClockIn={executeClockIn} onClockOut={handleClockOutRequest} activeClockId={activeClockId} />
            ))}
          </div>

          <div className="border-b border-gray-200 mb-6 flex justify-between items-center">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setDashboardTab("All")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${dashboardTab === "All" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                All
              </button>
              <button
                onClick={() => setDashboardTab("Projects")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${dashboardTab === "Projects" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                Projects
              </button>
              <button
                onClick={() => setDashboardTab("Service Calls")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${dashboardTab === "Service Calls" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                Service Calls
              </button>
            </nav>
            <button onClick={() => handleRequestHelp()} className="inline-flex items-center bg-yellow-500 text-white hover:bg-yellow-600 px-3 py-2 text-sm font-medium rounded-md shadow-sm">
              <HelpCircle size={16} className="mr-2" /> Request Help
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-[#162944] mb-4">Today's Schedule</h2>
              <TaskTable
                tasks={filteredTasks.todaysTasks}
                onClockIn={handleClockInRequest}
                onClockOut={handleClockOutRequest}
                activeClockId={activeClockId}
                onViewTask={setSelectedTaskId}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#162944] mb-4">Tomorrow's Schedule</h2>
              <TaskTable
                tasks={filteredTasks.tomorrowsTasks}
                onClockIn={handleClockInRequest}
                onClockOut={handleClockOutRequest}
                activeClockId={activeClockId}
                onViewTask={setSelectedTaskId}
              />
            </div>
          </div>
        </div>
      );
    }

    if (activePage === "Archive") {
      const archivedTasks = tasks.filter((task) => task.status === "Completed");
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <TaskTable tasks={archivedTasks} isArchived onViewTask={setSelectedTaskId} onClockIn={() => {}} onClockOut={() => {}} activeClockId={activeClockId} />
        </div>
      );
    }

    if (activePage === "Time Entries") return <TimeEntriesPage entries={timeEntries} />;
    if (activePage === "Help Requests") return <HelpRequestsPage requests={helpRequests} onAddReply={handleHelpReply} />;

    return <div>Page not found</div>;
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex">
      <Sidebar isOpen={isSidebarOpen} activePage={activePage} setActivePage={handlePageChange} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <TaskModuleHeader
            title={selectedTask ? "Task Details" : activePage}
            dateText={now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            timeText={now.toLocaleTimeString()}
          />
          {activeTask && !selectedTask && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg mb-6 shadow-md" role="alert">
              <div className="flex items-center">
                <span className="mr-3">⏱️</span>
                <div>
                  <p className="font-bold">Currently Clocked In: {activeTask.name}</p>
                  {"customer" in activeTask && <p>Customer: {(activeTask as AnyTask).customer}</p>}
                </div>
              </div>
            </div>
          )}
          {notification && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-6 shadow-md" role="alert">
              <p>{notification}</p>
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      <ConfirmModal isOpen={showConfirmModal} onConfirm={confirmClockOut} onCancel={() => setShowConfirmModal(false)} title="Confirm Clock Out">
        Are you sure you want to clock out from the task "{taskToConfirm?.name}"?
      </ConfirmModal>

      <ConfirmModal isOpen={showTomorrowConfirmModal} onConfirm={confirmClockInTomorrow} onCancel={() => setShowTomorrowConfirmModal(false)} title="Confirm Clock In">
        This task is scheduled for tomorrow. Are you sure you want to clock in now?
      </ConfirmModal>

      <RequestHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        tasks={tasks.filter((t) => t.status !== "Completed")}
        onSubmit={handleHelpSubmit}
        defaultTaskId={helpModalDefaultTaskId}
      />
    </div>
  );
}

