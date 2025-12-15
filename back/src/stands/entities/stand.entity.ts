import { StandApplication, StandStatus } from '@prisma/client';

export class StandEntity implements StandApplication {
  id!: string;
  userId!: string;
  brandName!: string;
  type!: string;
  contactName!: string;
  email!: string;
  phone!: string;
  socials!: string;
  description!: string;
  needs!: string;
  images!: string[];
  status!: StandStatus;
  eventId!: string | null;
  messages!: any[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<StandEntity>) {
    Object.assign(this, partial);
  }
}
