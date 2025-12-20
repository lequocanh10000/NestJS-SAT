import { StringNotRequired } from 'src/common/decorators';

export class StartSessionDto {
  @StringNotRequired()
  skill?: string;
}
