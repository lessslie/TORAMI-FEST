import { CosplayRegistration, CosplayStatus } from '@prisma/client';

export class CosplayEntity implements CosplayRegistration {
  id!: string;
  userId!: string;
  eventId!: string;
  participantName!: string;
  nickname!: string;
  whatsapp!: string;
  characterName!: string;
  seriesName!: string;
  category!: string;
  referenceImage!: string | null;
  audioLink!: string | null;
  status!: CosplayStatus;
  notifyEmail!: string | null;
  messages!: any[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<CosplayEntity>) {
    Object.assign(this, partial);
  }
}
