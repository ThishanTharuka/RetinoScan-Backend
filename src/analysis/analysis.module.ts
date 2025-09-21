import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ModelApiService } from './model-api.service';
import { Analysis, AnalysisSchema } from './schemas/analysis.schema';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
    HttpModule,
    UploadModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, ModelApiService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
