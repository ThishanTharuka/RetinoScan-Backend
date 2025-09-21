import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnalysisDocument = HydratedDocument<Analysis>;

export interface PatientInfo {
  name: string;
  age?: number;
  gender?: string;
  notes?: string;
}

export interface PredictionResult {
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  affectedAreas?: Array<{
    x: number;
    y: number;
    radius: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  processingTime?: number;
}

@Schema({ timestamps: true })
export class Analysis {
  @Prop({ required: true })
  userId: string; // Firebase UID

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
