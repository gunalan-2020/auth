import { User } from '../user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
