import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return { status: 'ok', message: 'Torami Fest API' };
  }
}
