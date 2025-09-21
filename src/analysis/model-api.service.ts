import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';

export interface ModelApiPrediction {
  condition: string;
  confidence: number;
  probability: number;
}

export interface ModelApiResponse {
  status: string;
  patient_id: string;
  patient_name: string;
  predictions: ModelApiPrediction[];
  primary_diagnosis: string;
  confidence_score: number;
  processing_time: number;
  timestamp: string;
  metadata: {
    model_version: string;
    model_architecture: string;
    preprocessing: string;
    image_size: number[];
    file_name?: string;
    file_size?: number;
  };
}

@Injectable()
export class ModelApiService {
  private readonly modelApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.modelApiUrl = this.configService.get<string>(
      'MODEL_API_URL',
      'http://localhost:8001',
    );
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.modelApiUrl}/api/v1/health`),
      );
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Model API health check failed:', error.message);
      return false;
    }
  }

  async predictFromFile(
    file: Express.Multer.File,
    patientId: string,
    patientName: string,
  ): Promise<ModelApiResponse> {
    try {
      // Check if Model API is available
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        throw new HttpException(
          'Model API is not available',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      formData.append('patient_id', patientId);
      formData.append('patient_name', patientName);

      // Send request to Model API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.modelApiUrl}/api/v1/predict/upload`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000, // 30 seconds timeout
          },
        ),
      );

      if (response.data.status !== 'success') {
        throw new HttpException(
          `Model API prediction failed: ${response.data.message || 'Unknown error'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Model API prediction error:', error);

      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          'Cannot connect to Model API. Please ensure the model server is running.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.response?.status === 400) {
        throw new HttpException(
          `Invalid request to Model API: ${error.response.data?.detail || 'Bad request'}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.response?.status === 503) {
        throw new HttpException(
          'Model is not loaded. Please wait for the server to initialize.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        `Model API error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async predictFromBase64(
    imageBase64: string,
    patientId: string,
    patientName: string,
  ): Promise<ModelApiResponse> {
    try {
      // Check if Model API is available
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        throw new HttpException(
          'Model API is not available',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const requestData = {
        image_base64: imageBase64,
        patient_id: patientId,
        patient_name: patientName,
      };

      // Send request to Model API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.modelApiUrl}/api/v1/predict`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds timeout
          },
        ),
      );

      if (response.data.status !== 'success') {
        throw new HttpException(
          `Model API prediction failed: ${response.data.message || 'Unknown error'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Model API prediction error:', error);

      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          'Cannot connect to Model API. Please ensure the model server is running.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.response?.status === 400) {
        throw new HttpException(
          `Invalid request to Model API: ${error.response.data?.detail || 'Bad request'}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.response?.status === 503) {
        throw new HttpException(
          'Model is not loaded. Please wait for the server to initialize.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        `Model API error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
