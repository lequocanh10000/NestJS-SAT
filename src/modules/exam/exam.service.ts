import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TestSession } from 'src/models/test-session.model';
import { TestResponse } from 'src/models/test-response.model';
import { Question } from 'src/models/question.model';
import { QuestionChoice } from 'src/models/question-choice.model';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';


@Injectable()
export class ExamService {
  constructor(
    @InjectModel(TestSession) private readonly sessionModel: typeof TestSession,
    @InjectModel(TestResponse) private readonly responseModel: typeof TestResponse,
    @InjectModel(Question) private readonly questionModel: typeof Question,
    @InjectModel(QuestionChoice) private readonly choiceModel: typeof QuestionChoice,
  ) {}

  async startSession(userId: number, dto: StartSessionDto) {
    const session = await this.sessionModel.create({
      userId,
      skill: dto.skill ?? null,
      startedAt: new Date(),
    } as any);

    return {
      message: 'Khởi tạo phiên làm bài thành công',
      data: session.toJSON(),
    };
  }

  async requireSession(sessionId: number, userId: number) {
    const session = await this.sessionModel.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Không tìm thấy phiên làm bài');
    return session;
  }

  async getSession(sessionId: number, userId: number) {
    const session = await this.requireSession(sessionId, userId);
    return { message: 'Lấy phiên làm bài thành công', data: session.toJSON() };
  }

  async getQuestions(sessionId: number, userId: number) {
    const session = await this.requireSession(sessionId, userId);
    const where: any = {};
    if (session.skill) where.skill = session.skill;

    const questions = await this.questionModel.findAll({
      where,
      include: [{ model: QuestionChoice, attributes: ['id', 'choiceText', 'isCorrect', 'choiceOrder'] }],
      order: [['id', 'ASC']],
    });

    return {
      message: 'Lấy danh sách câu hỏi thành công',
      data: questions.map((q) => q.toJSON()),
    };
  }

  async getNextQuestion(sessionId: number, userId: number) {
    const session = await this.requireSession(sessionId, userId);
    const where: any = {};
    if (session.skill) where.skill = session.skill;

    const responses = await this.responseModel.findAll({
      where: { sessionId },
      attributes: ['questionId'],
    });
    const answeredIds = new Set(responses.map((r: any) => r.questionId));

    const questions = await this.questionModel.findAll({
      where,
      include: [{ model: QuestionChoice, attributes: ['id', 'choiceText', 'isCorrect', 'choiceOrder'] }],
      order: [['id', 'ASC']],
    });

    const next = questions.find((q) => !answeredIds.has(q.id));
    if (!next) {
      return { message: 'Đã trả lời hết câu hỏi', data: null };
    }

    return { message: 'Lấy câu hỏi kế tiếp thành công', data: next.toJSON() };
  }

  async submitAnswer(sessionId: number, userId: number, dto: SubmitAnswerDto) {
    await this.requireSession(sessionId, userId);

    const question = await this.questionModel.findByPk(dto.questionId, { include: [QuestionChoice] });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    const choice = await this.choiceModel.findOne({ where: { id: dto.choiceId, questionId: dto.questionId } });
    if (!choice) throw new BadRequestException('Phương án lựa chọn không hợp lệ');

    const isCorrect = !!choice.isCorrect;

    const existing = await this.responseModel.findOne({ where: { sessionId, questionId: dto.questionId } });
    if (existing) {
      await existing.update({
        selectChoiceId: String(dto.choiceId),
        isCorrect,
        responseTime: new Date(),
      });
    } else {
      await this.responseModel.create({
        sessionId,
        questionId: dto.questionId,
        selectChoiceId: String(dto.choiceId),
        isCorrect,
        responseTime: new Date(),
      } as any);
    }

    const total = await this.responseModel.count({ where: { sessionId } });
    const correct = await this.responseModel.count({ where: { sessionId, isCorrect: true } });
    return {
      message: 'Ghi câu trả lời thành công',
      data: { answered: total, correct },
    };
  }

  async finishSession(sessionId: number, userId: number) {
    const session = await this.requireSession(sessionId, userId);
    await session.update({ endedAt: new Date() });

    const total = await this.responseModel.count({ where: { sessionId } });
    const correct = await this.responseModel.count({ where: { sessionId, isCorrect: true } });

    return {
      message: 'Kết thúc phiên làm bài thành công',
      data: { sessionId, answered: total, correct },
    };
  }

  async getResult(sessionId: number, userId: number) {
    await this.requireSession(sessionId, userId);
    const responses = await this.responseModel.findAll({
      where: { sessionId },
      include: [{ model: Question, attributes: ['id', 'content', 'skill', 'section'] }],
      order: [['responseTime', 'ASC']],
    });
    const total = responses.length;
    const correct = responses.filter((r) => r.isCorrect).length;

    return {
      message: 'Lấy kết quả phiên làm bài thành công',
      data: { total, correct, responses: responses.map((r) => r.toJSON()) },
    };
  }
}
