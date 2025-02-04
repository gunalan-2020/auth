import { UserRole } from '../enum/user-role.enum';

export interface UserPayload {
  id: number;
  email: string;
  role: UserRole;
}
