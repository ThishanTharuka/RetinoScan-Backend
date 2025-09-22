import { PatientInfo, PredictionResult } from '../schemas/analysis.schema';

export class AnalysisResponseDto {
  actualStage?: string;
  patientId?: string;
  id: string;
  userId: string;
  originalImageUrl: string;
  analyzedImageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  patientInfo?: PatientInfo;
  prediction?: PredictionResult;
  uploadDate: Date;
  analysisDate?: Date;
  errorMessage?: string;
}
