import { User, UserRole } from '@prisma/client';

export class UserEntity implements User {
  id!: string;
  name!: string;
  email!: string;
  password!: string;
  role!: UserRole;
  avatar!: string | null;
  entryAuthorized!: boolean;
  ticketType!: string | null;
  age!: number | null;
  phone!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
