import { PartialType } from '@nestjs/swagger';
import { CreateBenefitDto } from './create-benefit.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBenefitDto extends PartialType(CreateBenefitDto) {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
