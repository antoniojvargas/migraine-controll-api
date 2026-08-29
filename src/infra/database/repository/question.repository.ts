import { QuestionEntity } from '@/infra/database/entities';
import { BaseRepository } from './base.repository';

export class QuestionRepository extends BaseRepository<QuestionEntity> {}
