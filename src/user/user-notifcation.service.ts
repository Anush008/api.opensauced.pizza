import { Injectable } from "@nestjs/common";
import { Repository, SelectQueryBuilder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { DbUserNotification } from "./entities/user-notification.entity";
import { PageMetaDto } from "../common/dtos/page-meta.dto";
import { PageDto } from "../common/dtos/page.dto";
import { PageOptionsDto } from "../common/dtos/page-options.dto";
import { UserNotificationTypes, userNotificationTypes } from "./entities/user-notification.constants";
import { UserService } from "./user.service";

@Injectable()
export class UserNotificationService {
  constructor (
    @InjectRepository(DbUserNotification, "ApiConnection")
    private userNotificationRepository: Repository<DbUserNotification>,
    private userService: UserService,
  ) {}

  baseQueryBuilder (): SelectQueryBuilder<DbUserNotification> {
    const builder = this.userNotificationRepository.createQueryBuilder("user_notifications");

    return builder;
  }

  async findAllByUserId (userId: number, pageOptionsDto: PageOptionsDto) {
    const queryBuilder = this.baseQueryBuilder();

    queryBuilder
      .innerJoin("users", "users", "user_notifications.user_id=users.id")
      .where("user_id = :userId", { userId })
      .andWhere("user_notifications.type IN (:...userNotificationTypes)", { userNotificationTypes })
      .andWhere("user_notifications.read_at IS NULL");

    const entities = await queryBuilder.getMany();
    const itemCount = await queryBuilder.getCount();
    const notificationIds = entities.map(notification => notification.id);

    await this.markNotificationsAsRead(notificationIds);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async addUserNotification (userNotification: Partial<DbUserNotification>) {
    return this.userNotificationRepository.save({
      type: userNotification.type,
      notified_at: (new Date),
      user_id: userNotification.user_id,
      message: userNotification.message,
      from_user_id: userNotification.from_user_id,
      meta_id: userNotification.meta_id,
    });
  }

  async addUserFollowerNotification (userId: number, followedUserId: number ) {
    const followUser = await this.userService.findOneById(userId);

    return this.addUserNotification({
      type: UserNotificationTypes.Follow,
      user_id: followedUserId,
      from_user_id: userId,
      message: `${followUser.login} followed you`,
      meta_id: followUser.login,
    });
  }

  async addUserHighlightNotification (userId: number, highlightUserId: number, highlightId: number) {
    const followUser = await this.userService.findOneById(userId);

    return this.addUserNotification({
      type: UserNotificationTypes.HighlightReaction,
      user_id: highlightUserId,
      from_user_id: userId,
      message: `${followUser.login} reacted to your highlight`,
      meta_id: `${highlightId}`,
    });
  }

  async markNotificationsAsRead (notificationIds: number[]) {
    const updates = notificationIds.map(async id => this.userNotificationRepository.update(id, { read_at: (new Date) }));

    await Promise.all(updates);
  }
}
