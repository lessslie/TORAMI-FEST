import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { EventsModule } from './events/events.module';
import { StandsModule } from './stands/stands.module';
import { CosplayModule } from './cosplay/cosplay.module';
import { GalleryModule } from './gallery/gallery.module';
import { GiveawaysModule } from './giveaways/giveaways.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';
import { StampsModule } from './stamps/stamps.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.example'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    UploadsModule,
    EventsModule,
    StandsModule,
    CosplayModule,
    GalleryModule,
    GiveawaysModule,
    SponsorsModule,
    NotificationsModule,
    StatsModule,
    StampsModule,
    AppConfigModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
