import { NumberRequired } from 'src/common/decorators';

export class SubmitAnswerDto {
  @NumberRequired('questionId')
  questionId: number;

  @NumberRequired('choiceId')
  choiceId: number;
}
