import { IsOptional, IsString, IsIn, IsDateString, MaxLength } from 'class-validator';

const TASK_STATUSES = ['pendente', 'concluida', 'cancelada'];

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignee?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: string;
}
