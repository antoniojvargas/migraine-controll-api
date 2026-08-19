import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SelectionEntity } from './selection.entity';

@Entity('translations')
@Index(['selection', 'languageCode'], { unique: true })
export class TranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'language_code' })
  languageCode!: string;

  @Column({ type: 'varchar' })
  text!: string;

  @ManyToOne(() => SelectionEntity, (selection) => selection.translations, { nullable: false })
  @JoinColumn({ name: 'selection_id' })
  @Index()
  selection!: SelectionEntity;
}
