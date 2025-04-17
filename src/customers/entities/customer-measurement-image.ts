import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {CustomerMeasurement} from "./customer-measurement.entity";
import {Expose} from "class-transformer";

@Entity()
export class CustomerMeasurementImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    url: string;

    @Expose()
    get full_image_url(): string {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        return this.url ? `${baseUrl}${this.url}` : null;
    }

    @ManyToOne(() => CustomerMeasurement, (customerMeasurement) => customerMeasurement.images, { onDelete: 'CASCADE' })
    measurement: CustomerMeasurement;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
