export type ApartmentStatus =
  | 'ACTIVE' | 'OCCUPIED' | 'RENTED' | 'VACANT' | 'CLOSED'
  | 'MAINTENANCE' | 'TEMPORARILY_DISABLED' | 'ARCHIVED';

export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'viewer' | 'resident';

export type Apartment = {
  apartment_number: number;
  floor_number: number;
  status: ApartmentStatus;
  owner_name?: string | null;
  tenant_name?: string | null;
  balance_due?: number;
  overdue_amount?: number;
  last_payment_at?: string | null;
};

export type DueRow = {
  due_id: string;
  apartment_number: number;
  period: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  status: string;
  is_overdue: boolean;
};

export type PaymentRow = {
  id: string;
  apartment_number: number;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  status: string;
  notes: string | null;
};

export type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  date: string;
  supplier: string | null;
  status: string;
  apartment_number: number | null;
};

export type ExpenseCategory = { id: string; name: string };

export type DashboardStats = {
  fundBalance: number;
  monthCollections: number;
  monthExpenses: number;
  overdue: number;
  statusCounts: Record<string, number>;
  integrityIssues: string[];
};

export type ApartmentDetail = {
  apartment: Apartment;
  dues: DueRow[];
  payments: PaymentRow[];
};
