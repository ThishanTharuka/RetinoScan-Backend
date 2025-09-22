import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnalysisDocument = HydratedDocument<Analysis>;

export interface PatientInfo {
  name: string;
  age?: number;
  gender?: string;
  notes?: string;
}

export interface AnalysisGroundTruth {
  actualStage?: string;
}

export interface ModelPrediction {
  condition: string;
  confidence: number;
  probability: number;
}

export interface PredictionResult {
  predictions: ModelPrediction[];
  primary_diagnosis: string;
  confidence_score: number;
  processing_time: number;
  severity_level: number;
  severity_name: string;
  urgency_level: string;
  recommendations: string[];
  metadata: {
    model_version: string;
    model_architecture: string;
    preprocessing: string;
    image_size: number[];
    file_name?: string;
    file_size?: number;
  };
}

@Schema({ timestamps: true })
export class Analysis {
  @Prop({ required: true })
  userId: string; // Firebase UID

  @Prop()
  patientId?: string; // Optional patient identifier collected from frontend

  @Prop({ required: true })
  originalImageUrl: string;

  @Prop()
  analyzedImageUrl?: string;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Object })
  patientInfo?: PatientInfo;

  @Prop()
  actualStage?: string; // optional clinician-provided ground truth

  @Prop({ type: Object })
  prediction?: PredictionResult;

  @Prop()
  errorMessage?: string;

  @Prop({ default: Date.now })
  uploadDate: Date;

  @Prop()
  analysisDate?: Date;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
