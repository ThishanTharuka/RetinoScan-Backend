import { PatientInfo, PredictionResult } from '../schemas/analysis.schema';

export class AnalysisResponseDto {
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
