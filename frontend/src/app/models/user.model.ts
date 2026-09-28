export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'office' | 'warehouse';
  is_active: boolean;
}