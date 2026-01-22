import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { EventsModule } from './events/events.module';
import { StandsModule } from './stands/stands.module';
import { CosplayModule } from './cosplay/cosplay.module';
import { CosplayGuestModule } from './cosplay-guest/cosplay-guest.module';
import { GalleryModule } from './gallery/gallery.module';
import { GiveawaysModule } from './giveaways/giveaways.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';
import { StampsModule } from './stamps/stamps.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { ChatModule } from './chat/chat.module';
import { DonationsModule } from './donations/donations.module';
import { KaraokeModule } from './karaoke/karaoke.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.example'],
    }),
    // Rate limiting global: máx 100 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1 minuto
        limit: 100,  // máx 100 requests por minuto
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    UploadsModule,
    EventsModule,
    StandsModule,
    CosplayModule,
    CosplayGuestModule,
    GalleryModule,
    GiveawaysModule,
    SponsorsModule,
    NotificationsModule,
    StatsModule,
    StampsModule,
    AppConfigModule,
    ChatModule,
    DonationsModule,
    KaraokeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Activar rate limiting global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
