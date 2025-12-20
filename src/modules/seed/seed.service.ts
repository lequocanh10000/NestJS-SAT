import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { AIEvualuation, Cache, IRLParameter, Question, QuestionChoice, TestResponse, TestSession, User } from 'src/models';
import { irtParameters, questionChoices, questions } from './data';

@Injectable()
export class SeedService {
    constructor(
        @InjectModel(AIEvualuation) private readonly aiEvulationModel: typeof AIEvualuation,
        @InjectModel(Cache) private readonly cacheModel: typeof Cache,
        @InjectModel(IRLParameter) private readonly irlParameterModel: typeof IRLParameter,
        @InjectModel(Question) private readonly questionModel: typeof Question,
        @InjectModel(QuestionChoice) private readonly questionChoiceModel: typeof QuestionChoice,
        @InjectModel(TestResponse) private readonly testResponseModel: typeof TestResponse,
        @InjectModel(TestSession) private readonly testSessionModel: typeof TestSession,
        @InjectModel(User) private readonly userModel: typeof User,
        private readonly sequelize: Sequelize,

    ) {}

    private async clearExisting(transaction: Transaction) {
        await this.irlParameterModel.destroy({ where: {}, transaction });
        await this.questionChoiceModel.destroy({ where: {}, transaction });
        await this.questionModel.destroy({ where: {}, transaction });
    }

    private async seedQuestions(transaction: Transaction) {
        const created: Question[] = [];
        for (const q of questions) {
            const saved = await this.questionModel.create(q as any, { transaction });
            created.push(saved);
        }
        return created;
    }

    private async seedQuestionChoices(transaction: Transaction, idMap: Map<number, number>) {
        const payload = questionChoices.map(c => ({ ...c, questionId: idMap.get(c.questionId)! }));
        return await this.questionChoiceModel.bulkCreate(payload as any, { transaction });
    }

    private async seedIRL(transaction: Transaction, idMap: Map<number, number>) {
        const payload = irtParameters.map(p => ({ ...p, questionId: idMap.get(p.questionId)! }));
        return await this.irlParameterModel.bulkCreate(payload as any, { transaction });
    }

    async initSeedData() {
        const transaction = await this.sequelize.transaction();
        try {
            await this.clearExisting(transaction);
            const created = await this.seedQuestions(transaction);
            const idMap = new Map<number, number>();
            created.forEach((q, idx) => idMap.set(idx + 1, q.id));
            await this.seedQuestionChoices(transaction, idMap);
            await this.seedIRL(transaction, idMap);
            await transaction.commit();
            return { message: 'Seed data success' }
        } catch(error) {
            await transaction.rollback();
            throw new BadRequestException('Seed data failed');
        }
    }
}
