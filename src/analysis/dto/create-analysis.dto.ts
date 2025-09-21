import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAnalysisDto {
  @IsString()
  patientName: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsNumber()
  patientAge?: number;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  patientGender?: string;

  @IsOptional()
  @IsString()
  patientNotes?: string;
}
