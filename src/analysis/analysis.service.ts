import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResponseDto } from './dto/analysis-response.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(Analysis.name)
    private readonly analysisModel: Model<AnalysisDocument>,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    userId: string,
    file: Express.Multer.File,
    createAnalysisDto: CreateAnalysisDto,
  ): Promise<AnalysisResponseDto> {
    // Upload image to Cloudinary
    const imageUrl = await this.uploadService.uploadImage(
      file,
      'retinal-scans',
    );

    // Create analysis document
    const analysis = new this.analysisModel({
      userId,
      originalImageUrl: imageUrl,
      patientInfo: {
        name: createAnalysisDto.patientName,
        age: createAnalysisDto.patientAge,
        gender: createAnalysisDto.patientGender,
        notes: createAnalysisDto.patientNotes,
      },
      status: 'pending',
    });

    const savedAnalysis = await analysis.save();

    // TODO: Trigger ML processing here
    // this.triggerMLProcessing(savedAnalysis._id.toString());

    return this.toResponseDto(savedAnalysis);
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
