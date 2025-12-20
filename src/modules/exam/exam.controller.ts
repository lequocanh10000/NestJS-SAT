import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentInfo } from 'src/common/decorators';
import { ExamService } from './exam.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';


@ApiTags('Exam')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('sessions/start')
  @ApiOperation({ summary: 'Bắt đầu phiên làm bài (TestSession)' })
  startSession(@CurrentInfo() user: any, @Body() dto: StartSessionDto) {
    return this.examService.startSession(user.uid, dto);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Lấy thông tin phiên làm bài' })
  getSession(@Param('sessionId', ParseIntPipe) sessionId: number, @CurrentInfo() user: any) {
    return this.examService.getSession(sessionId, user.uid);
  }

  @Get('sessions/:sessionId/questions')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi cho phiên làm bài' })
  getQuestions(@Param('sessionId', ParseIntPipe) sessionId: number, @CurrentInfo() user: any) {
    return this.examService.getQuestions(sessionId, user.uid);
  }

  @Get('sessions/:sessionId/next')
  @ApiOperation({ summary: 'Lấy câu hỏi kế tiếp (chưa trả lời)' })
  getNext(@Param('sessionId', ParseIntPipe) sessionId: number, @CurrentInfo() user: any) {
    return this.examService.getNextQuestion(sessionId, user.uid);
  }

  @Post('sessions/:sessionId/answers')
  @ApiOperation({ summary: 'Gửi/ghi câu trả lời' })
  submitAnswer(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @CurrentInfo() user: any,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.examService.submitAnswer(sessionId, user.uid, dto);
  }

  @Post('sessions/:sessionId/finish')
  @ApiOperation({ summary: 'Kết thúc phiên làm bài và lấy kết quả' })
  finish(@Param('sessionId', ParseIntPipe) sessionId: number, @CurrentInfo() user: any) {
    return this.examService.finishSession(sessionId, user.uid);
  }

  @Get('sessions/:sessionId/result')
  @ApiOperation({ summary: 'Xem kết quả phiên làm bài' })
  getResult(@Param('sessionId', ParseIntPipe) sessionId: number, @CurrentInfo() user: any) {
    return this.examService.getResult(sessionId, user.uid);
  }
}
