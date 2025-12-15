export interface StandMessage {
  id: string;
  text: string;
  sender: 'ADMIN' | 'USER';
  timestamp: string;
  imageUrl?: string;
}
