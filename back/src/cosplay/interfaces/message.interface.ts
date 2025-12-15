export interface CosplayMessage {
  id: string;
  text: string;
  sender: 'ADMIN' | 'USER';
  timestamp: string;
  imageUrl?: string;
}
