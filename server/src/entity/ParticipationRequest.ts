import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm'
import {Placement} from './Placement'
import {User} from './User'

@Entity()
export class ParticipationRequest {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    @ManyToOne(() => Placement, placement => placement.participationRequests)
    @JoinColumn()
    public placement: Placement

    @Column()
    @ManyToOne(() => User, user => user.participationRequests)
    @JoinColumn()
    public user: User
}
