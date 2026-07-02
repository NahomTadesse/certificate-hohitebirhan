export interface User {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  gender: string;
  dob: string;
  status: string;
  role: string;
  photo?: string | null;
}
