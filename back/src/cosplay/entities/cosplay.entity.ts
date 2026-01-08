import { CosplayRegistration, CosplayStatus } from '@prisma/client';

export class CosplayEntity implements CosplayRegistration {
  id!: string;
  userId!: string;
  eventId!: string;
  participantName!: string;
  nickname!: string;
  whatsapp!: string;
  instagram!: string | null;
  website!: string | null;
  characterName!: string;
  seriesName!: string;
  category!: string;
  referenceImage!: string | null;
  audioLink!: string | null;
  audioStartTime!: string | null;
  audioEndTime!: string | null;
  status!: CosplayStatus;
  notifyEmail!: string | null;
  messages!: any[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<CosplayEntity>) {
    Object.assign(this, partial);
  }
}
