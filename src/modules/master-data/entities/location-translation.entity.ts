import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Location } from './location.entity';

@Entity('location_translations')
@Index(['locationId', 'language'], { unique: true })
export class LocationTranslation extends BaseEntity {
  @Column({ name: 'location_id' })
  locationId!: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location!: Location;

  @Column()
  language!: string;

  @Column({ type: 'text' })
  name!: string;
}
