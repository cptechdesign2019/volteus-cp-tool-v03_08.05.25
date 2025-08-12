export type TaskId = number | string;

export type TaskType = "Project" | "Service Call" | "Internal";

export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Active"
  | "Available"
  | "Resolved";

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  productNumber: string;
  description: string;
  quantity: number;
  status: "On Truck" | "Installed";
  imageUrl: string;
}

export interface ExpenseItem {
  id: number;
  item: string;
  cost: number; // in USD
  date: string; // ISO string
}

export interface NoteItem {
  user: string;
  timestamp: string; // ISO string
  text: string;
}

export interface PictureInfo {
  url: string; // may be an object URL for preview
  name: string;
}

export interface PicturesByPhase {
  before: PictureInfo[];
  after: PictureInfo[];
}

export interface BaseTask {
  id: TaskId;
  type: Exclude<TaskType, "Internal">;
  name: string;
  customer: string;
  startDate: string; // YYYY-MM-DD local
  status: Exclude<TaskStatus, "Available" | "Active" | "Resolved">;
  assignedTo: string;
  contact: ContactInfo;
  address: string;
  expenses: ExpenseItem[];
  notes: NoteItem[];
  pictures: PicturesByPhase;
}

export interface ProjectTask extends BaseTask {
  type: "Project";
  scopeOfWork: string;
  taskList: { id: string; text: string; completed: boolean }[];
  equipment: EquipmentItem[];
}

export interface ServiceCallTask extends BaseTask {
  type: "Service Call";
  issueDescription: string;
}

export type AnyTask = ProjectTask | ServiceCallTask;

export interface InternalTask {
  id: "meeting" | "shop" | string;
  type: "Internal";
  name: string;
  customer: "Internal" | string;
  status: "Available" | "Active" | string;
}

export interface TimeEntry {
  id: number;
  taskName: string;
  customer?: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  durationMs: number;
}

export interface HelpThreadMessage {
  user: string;
  text: string;
  timestamp: string; // ISO datetime
}

export interface HelpRequest {
  id: number;
  taskId: TaskId;
  taskName: string;
  recipient: "Project Manager" | "Engineer" | string;
  status: "Active" | "Resolved";
  thread: HelpThreadMessage[];
}

