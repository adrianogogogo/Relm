import { IsOptional, IsString, IsIn, IsDateString, MaxLength } from 'class-validator';

const TASK_STATUSES = ['pendente', 'concluida', 'cancelada'];

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignee?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
