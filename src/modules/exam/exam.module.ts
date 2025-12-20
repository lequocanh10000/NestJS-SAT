import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TestSession } from 'src/models/test-session.model';
import { TestResponse } from 'src/models/test-response.model';
import { Question } from 'src/models/question.model';
import { QuestionChoice } from 'src/models/question-choice.model';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [SequelizeModule.forFeature([TestSession, TestResponse, Question, QuestionChoice])],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
