import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checkpoint } from './checkpoint.entity';
import { CheckpointService } from './checkpoint.service';
import { CheckpointController } from './checkpoint.controller';
import {UserModule} from "../users/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Checkpoint]),
        UserModule,
    ],
    controllers: [CheckpointController],
    providers: [CheckpointService],
    exports: [CheckpointService, TypeOrmModule],
})
export class CheckpointModule {}
