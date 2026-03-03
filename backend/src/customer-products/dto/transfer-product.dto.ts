import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class TransferProductDto {
  @ApiProperty({ description: 'Email do novo dono' })
  @IsEmail()
  @IsNotEmpty()
  newOwnerEmail: string;

  @ApiProperty({ description: 'Notas sobre a transferência' })
  @IsString()
  @IsNotEmpty()
  transferNotes: string;
}
