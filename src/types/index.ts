export type Status = 'in-progress' | 'need to start' | 'complete' | 'blocked';

export type Priority = 'High' | 'Medium' | 'Low';

export interface SpreadsheetRow {
  id: number;
  jobRequest: string;
  submitted: string;
  status: Status;
  submitter: string;
  url: string;
  assigned: string;
  priority: Priority;
  dueDate: string;
  estValue: string;
  [key: string]: string | number | Status | Priority;
}

export interface Tab {
  id: string;
  label: string;
  active?: boolean;
} 