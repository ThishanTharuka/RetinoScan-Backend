import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResponseDto } from './dto/analysis-response.dto';
import { UploadService } from '../upload/upload.service';
import { ModelApiService } from './model-api.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Analysis.name)
    private readonly analysisModel: Model<AnalysisDocument>,
    private readonly uploadService: UploadService,
    private readonly modelApiService: ModelApiService,
  ) {}

  async create(
    userId: string,
    file: Express.Multer.File,
    createAnalysisDto: CreateAnalysisDto,
  ): Promise<AnalysisResponseDto> {
    let savedAnalysis: AnalysisDocument | null = null;

    try {
      // Step 1: Upload image to Cloudinary first
      const imageUrl = await this.uploadService.uploadImage(
        file,
        'retinal-scans',
      );

      // Step 2: Create initial analysis document with image URL
      const analysis = new this.analysisModel({
        userId,
        originalImageUrl: imageUrl,
        patientInfo: {
          name: createAnalysisDto.patientName,
          age: createAnalysisDto.patientAge,
          gender: createAnalysisDto.patientGender,
          notes: createAnalysisDto.patientNotes,
        },
        status: 'processing',
      });

      savedAnalysis = await analysis.save();

      // Step 3: Send to Model API for prediction
      const modelResponse = await this.modelApiService.predictFromFile(
        file,
        createAnalysisDto.patientName, // Use patient name as ID for now
        createAnalysisDto.patientName,
      );

      // Step 3: Map Model API response to our prediction format
      const conditionToSeverity: { [key: string]: number } = {
        'No Diabetic Retinopathy': 0,
        'Mild Diabetic Retinopathy': 1,
        'Moderate Diabetic Retinopathy': 2,
        'Severe Diabetic Retinopathy': 3,
        'Proliferative Diabetic Retinopathy': 4,
      };

      const severityMap: { [key: number]: string } = {
        0: 'No Diabetic Retinopathy',
        1: 'Mild Diabetic Retinopathy',
        2: 'Moderate Diabetic Retinopathy',
        3: 'Severe Diabetic Retinopathy',
        4: 'Proliferative Diabetic Retinopathy',
      };

      // Find the highest confidence prediction
      let severityLevel = 0;
      let maxConfidence = 0;
      modelResponse.predictions.forEach((pred) => {
        if (pred.confidence > maxConfidence) {
          maxConfidence = pred.confidence;
          severityLevel = conditionToSeverity[pred.condition] || 0;
        }
      });

      const getUrgencyLevel = (level: number): string => {
        if (level >= 3) return '🚨 URGENT';
        if (level >= 2) return '⚠️ MODERATE';
        if (level >= 1) return '💛 MILD';
        return '✅ NORMAL';
      };

      const getRecommendations = (level: number): string[] => {
        switch (level) {
          case 0:
            return ['Continue regular eye exams', 'Maintain healthy lifestyle'];
          case 1:
            return [
              'Schedule follow-up in 6-12 months',
              'Monitor blood sugar levels',
              'Consider lifestyle modifications',
            ];
          case 2:
            return [
              'Schedule follow-up in 3-6 months',
              'Consult with ophthalmologist',
              'Optimize diabetes management',
            ];
          case 3:
            return [
              'Urgent ophthalmologist referral required',
              'Consider laser treatment',
              'Intensive diabetes management',
            ];
          case 4:
            return [
              'IMMEDIATE ophthalmologist consultation',
              'May require surgery',
              'Emergency diabetes management',
            ];
          default:
            return ['Consult with healthcare provider'];
        }
      };

      // Step 4: Update analysis with prediction results
      savedAnalysis.status = 'completed';
      savedAnalysis.analysisDate = new Date();
      savedAnalysis.prediction = {
        predictions: modelResponse.predictions,
        primary_diagnosis: modelResponse.primary_diagnosis,
        confidence_score: modelResponse.confidence_score,
        processing_time: modelResponse.processing_time,
        severity_level: severityLevel,
        severity_name: severityMap[severityLevel],
        urgency_level: getUrgencyLevel(severityLevel),
        recommendations: getRecommendations(severityLevel),
        metadata: modelResponse.metadata,
      };

      // Save final analysis
      const finalAnalysis = await savedAnalysis.save();
      return this.toResponseDto(finalAnalysis);
    } catch (error) {
      console.error('Analysis processing error:', error);

      // Update analysis with error status if it was created
      if (savedAnalysis) {
        savedAnalysis.status = 'failed';
        savedAnalysis.errorMessage = error.message;
        await savedAnalysis.save();
      }

      // Re-throw the error so the controller can handle it
      throw error;
    }
  }

  async findAll(userId: string): Promise<AnalysisResponseDto[]> {
    const analyses = await this.analysisModel
      .find({ userId })
      .sort({ uploadDate: -1 })
      .exec();

    return analyses.map((analysis) => this.toResponseDto(analysis));
  }

  async findOne(id: string, userId: string): Promise<AnalysisResponseDto> {
    const analysis = await this.analysisModel
      .findOne({ _id: id, userId })
      .exec();

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return this.toResponseDto(analysis);
  }

  async updateAnalysisResult(
    id: string,
    result: any,
  ): Promise<AnalysisResponseDto> {
    const analysis = await this.analysisModel
      .findByIdAndUpdate(
        id,
        {
          status: 'completed',
          prediction: result.prediction,
          analyzedImageUrl: result.analyzedImageUrl,
          analysisDate: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return this.toResponseDto(analysis);
  }

  async delete(id: string, userId: string): Promise<void> {
    const analysis = await this.analysisModel
      .findOne({ _id: id, userId })
      .exec();

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    // Delete images from Cloudinary
    // TODO: Extract public ID from URLs and delete

    await this.analysisModel.findByIdAndDelete(id).exec();
  }

  private toResponseDto(analysis: AnalysisDocument): AnalysisResponseDto {
    return {
      id: analysis._id.toString(),
      userId: analysis.userId,
      originalImageUrl: analysis.originalImageUrl,
      analyzedImageUrl: analysis.analyzedImageUrl,
      status: analysis.status as any,
      patientInfo: analysis.patientInfo,
      prediction: analysis.prediction,
      uploadDate: analysis.uploadDate,
      analysisDate: analysis.analysisDate,
      errorMessage: analysis.errorMessage,
    };
  }

  // TODO: Implement ML service integration
  // private async triggerMLProcessing(analysisId: string): Promise<void> {
  //   // This will call the ML service
  // }
}
