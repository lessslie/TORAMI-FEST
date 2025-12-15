import { Event } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class EventEntity implements Event {
  id!: string;
  title!: string;
  date!: Date;
  time!: string;
  location!: string;
  description!: string;
  isPast!: boolean;
  tags!: string[];
  isFeatured!: boolean;
  rainCheck!: boolean;
  images!: string[];
  highlights!: string[];
  transport!: any;
  isFree!: boolean;
  ticketPrice!: Decimal | null;
  ticketLink!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<EventEntity>) {
    Object.assign(this, partial);
  }
}
