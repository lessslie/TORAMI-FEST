import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // No lanza error si no hay token, simplemente retorna null
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Intenta autenticar pero no falla si no hay token
    return super.canActivate(context);
  }
}
