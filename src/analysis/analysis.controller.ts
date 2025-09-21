import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResponseDto } from './dto/analysis-response.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('api/analysis')
@UseGuards(FirebaseAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createAnalysisDto: CreateAnalysisDto,
    @User() user: any,
  ): Promise<AnalysisResponseDto> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype.includes('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    return this.analysisService.create(user.uid, file, createAnalysisDto);
  }

  @Get()
  async findAll(@User() user: any): Promise<AnalysisResponseDto[]> {
    return this.analysisService.findAll(user.uid);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User() user: any,
  ): Promise<AnalysisResponseDto> {
    return this.analysisService.findOne(id, user.uid);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: any): Promise<void> {
    return this.analysisService.delete(id, user.uid);
  }
}
