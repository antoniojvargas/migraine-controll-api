import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NewSelectionEntity } from './new-selection.entity';

@Entity('new_translations')
@Index(['selection', 'languageCode'], { unique: true })
export class NewTranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'language_code' })
  languageCode!: string;

  @Column({ type: 'varchar' })
  text!: string;

  @ManyToOne(() => NewSelectionEntity, (selection) => selection.translations, { nullable: false })
  @JoinColumn({ name: 'selection_id' })
  @Index()
  selection!: NewSelectionEntity;
}
