import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  CreateDateColumn,
} from "typeorm";
import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";
import { UserNotificationTypes } from "./user-notification.constants";

@Entity({ name: "user_notifications" })
export class DbUserNotification extends BaseEntity {
  @ApiModelProperty({
    description: "Notification identifier",
    example: 237133,
  })
  @PrimaryColumn("bigint")
  public id!: number;

  @ApiModelProperty({
    description: "User ID",
    example: 498,
  })
  @Column({ type: "bigint" })
  public user_id: number;

  @ApiModelProperty({
    description: "From User ID",
    example: 43311,
  })
  @Column({ type: "bigint" })
  public from_user_id?: number;

  @ApiModelProperty({
    description: "User notification type",
    example: "welcome",
  })
  @Column({
    type: "character varying",
    enum: UserNotificationTypes,
    length: 25,
  })
  public type: string;

  @ApiModelProperty({
    description: "User notification message",
    example: "bdougie followed you",
  })
  @Column({
    type: "character varying",
    length: 100,
  })
  public message?: string;

  @ApiModelPropertyOptional({
    description: "Timestamp representing db-user-notification creation",
    example: "2022-10-19 13:24:51.000000",
  })
  @CreateDateColumn({
    type: "timestamp without time zone",
    default: () => "now()",
  })
  public notified_at?: Date;

  @ApiModelPropertyOptional({
    description: "Timestamp representing user notification read date",
    example: "2023-04-19 13:24:51.000000",
  })
  @Column({
    type: "timestamp without time zone",
    select: false,
  })
  public read_at?: Date;

  @ApiModelProperty({
    description: "Notification Source ID (highlight, user, invite)",
    example: "133",
  })
  @Column({
    type: "character varying",
    length: 32,
  })
  public meta_id?: string;
}
