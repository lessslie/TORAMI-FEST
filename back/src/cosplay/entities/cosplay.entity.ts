import { CosplayRegistration, CosplayStatus } from '@prisma/client';

export class CosplayEntity implements CosplayRegistration {
  id!: string;
  userId!: string;
  participantName!: string;
  nickname!: string;
  whatsapp!: string;
  characterName!: string;
  seriesName!: string;
  category!: string;
  referenceImage!: string | null;
  audioLink!: string | null;
  status!: CosplayStatus;
  messages!: any[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<CosplayEntity>) {
    Object.assign(this, partial);
  }
}
